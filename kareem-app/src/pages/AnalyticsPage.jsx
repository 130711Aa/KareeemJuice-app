import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import KPICard from '../components/analytics/KPICard'
import ProductPerformanceTable from '../components/analytics/ProductPerformanceTable'
import ProductMatrixChart from '../components/analytics/ProductMatrixChart'
import SalesTrendChart from '../components/analytics/SalesTrendChart'
import CustomerTable from '../components/analytics/CustomerTable'
import { Download, Printer, AlertTriangle, RefreshCw, CalendarDays, Clock, Calendar } from 'lucide-react'
import * as XLSX from 'xlsx'

// ─── Period helpers ───────────────────────────────────────────────────────────
function getPeriodRange(period) {
    const now = new Date()
    let from = null
    if (period === 'day') {
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    } else if (period === 'week') {
        const day = now.getDay() // 0=Sun
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day)
    } else if (period === 'month') {
        from = new Date(now.getFullYear(), now.getMonth(), 1)
    }
    // all = null (no filter)
    return from ? from.toISOString() : null
}

// ─── Data processing helpers ──────────────────────────────────────────────────
function buildSalesTrend(orders, period) {
    if (!orders || orders.length === 0) return []

    const buckets = {}

    if (period === 'day') {
        // Group by hour: 00 - 23
        for (let h = 0; h < 24; h++) {
            const label = `${String(h).padStart(2, '0')}:00`
            buckets[label] = { hour_label: label, total_revenue: 0, total_orders: 0 }
        }
        orders.forEach(o => {
            const d = new Date(o.created_at)
            const label = `${String(d.getHours()).padStart(2, '0')}:00`
            if (buckets[label]) {
                buckets[label].total_revenue += Number(o.total_amount || 0)
                buckets[label].total_orders += 1
            }
        })
        return Object.values(buckets)
    }

    if (period === 'week') {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
        days.forEach((d, i) => { buckets[i] = { day_label: d, total_revenue: 0, total_orders: 0 } })
        orders.forEach(o => {
            const dow = new Date(o.created_at).getDay()
            buckets[dow].total_revenue += Number(o.total_amount || 0)
            buckets[dow].total_orders += 1
        })
        return Object.values(buckets)
    }

    if (period === 'month') {
        const now = new Date()
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
        for (let d = 1; d <= daysInMonth; d++) {
            const label = String(d)
            buckets[label] = { date_label: label, total_revenue: 0, total_orders: 0 }
        }
        orders.forEach(o => {
            const d = new Date(o.created_at).getDate()
            const label = String(d)
            if (buckets[label]) {
                buckets[label].total_revenue += Number(o.total_amount || 0)
                buckets[label].total_orders += 1
            }
        })
        return Object.values(buckets)
    }

    // all time: group by month (YYYY-MM)
    orders.forEach(o => {
        const d = new Date(o.created_at)
        const label = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`
        const display = `${d.toLocaleString('id-ID', { month: 'short' })} '${String(d.getFullYear()).slice(-2)}`
        if (!buckets[label]) buckets[label] = { month_label: display, sort: label, total_revenue: 0, total_orders: 0 }
        buckets[label].total_revenue += Number(o.total_amount || 0)
        buckets[label].total_orders += 1
    })
    return Object.values(buckets).sort((a, b) => a.sort.localeCompare(b.sort))
}

function buildProductPerformance(orderItems) {
    const map = {}
    orderItems.forEach(item => {
        const name = item.name || 'Unknown'
        if (!map[name]) map[name] = { name, total_quantity: 0, total_revenue: 0 }
        map[name].total_quantity += Number(item.quantity || 0)
        map[name].total_revenue += Number(item.price || 0) * Number(item.quantity || 0)
    })
    return Object.values(map).sort((a, b) => b.total_revenue - a.total_revenue)
}

function buildProductMatrix(productPerformance) {
    if (!productPerformance || productPerformance.length === 0) return []
    const avgQty = productPerformance.reduce((s, p) => s + p.total_quantity, 0) / productPerformance.length
    const avgRev = productPerformance.reduce((s, p) => s + p.total_revenue, 0) / productPerformance.length

    return productPerformance.map(p => {
        let classification = 'Perlu Evaluasi (Dead Weight)'
        if (p.total_quantity >= avgQty && p.total_revenue >= avgRev) classification = 'Star'
        else if (p.total_quantity >= avgQty && p.total_revenue < avgRev) classification = 'Fasilitas Arus Kas (Volume)'
        else if (p.total_quantity < avgQty && p.total_revenue >= avgRev) classification = 'Premium'
        return { ...p, classification }
    })
}

function buildCustomerInsights(orders) {
    const map = {}
    orders.forEach(o => {
        const key = o.customer_phone || o.customer_name || 'Guest'
        if (!map[key]) {
            map[key] = {
                customer_name: o.customer_name || 'Guest',
                customer_phone: o.customer_phone || '-',
                total_transactions: 0,
                total_spent: 0
            }
        }
        map[key].total_transactions += 1
        map[key].total_spent += Number(o.total_amount || 0)
    })
    const result = Object.values(map).sort((a, b) => b.total_spent - a.total_spent)
    return result.map(c => ({
        ...c,
        customer_type: c.total_transactions > 1 ? 'Returning' : 'New'
    }))
}

// ─── Component ────────────────────────────────────────────────────────────────
const PERIODS = [
    { key: 'all', label: 'All Time', icon: <CalendarDays className="w-3.5 h-3.5" /> },
    { key: 'month', label: 'Bulan Ini', icon: <Calendar className="w-3.5 h-3.5" /> },
    { key: 'week', label: 'Minggu Ini', icon: <CalendarDays className="w-3.5 h-3.5" /> },
    { key: 'day', label: 'Hari Ini', icon: <Clock className="w-3.5 h-3.5" /> },
]

export default function AnalyticsPage() {
    const [period, setPeriod] = useState('all')
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    // Computed states
    const [summary, setSummary] = useState({ total_revenue: 0, total_orders: 0, overall_aov: 0 })
    const [salesTrend, setSalesTrend] = useState([])
    const [products, setProducts] = useState([])
    const [matrix, setMatrix] = useState([])
    const [customers, setCustomers] = useState([])
    const [forecast, setForecast] = useState({ predicted_revenue: 0, predicted_transactions: 0 })

    // Reset Modal
    const [showResetModal, setShowResetModal] = useState(false)
    const [resetting, setResetting] = useState(false)

    // Raw orders (all time, for export)
    const [allOrders, setAllOrders] = useState([])

    const fetchAnalytics = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true)
        else setLoading(true)

        try {
            const from = getPeriodRange(period)

            // Build query
            let query = supabase
                .from('orders')
                .select('id, created_at, total_amount, customer_name, customer_phone, status, notes, order_items(id, name, price, quantity)')
                .eq('status', 'completed')

            if (from) query = query.gte('created_at', from)

            const { data: orders, error } = await query.order('created_at', { ascending: true })
            if (error) throw error

            const safeOrders = orders || []
            const allItems = safeOrders.flatMap(o => (o.order_items || []))

            // ── Summary ──
            const totalRevenue = safeOrders.reduce((s, o) => s + Number(o.total_amount || 0), 0)
            const totalOrders = safeOrders.length
            const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0
            setSummary({ total_revenue: totalRevenue, total_orders: totalOrders, overall_aov: aov })

            // ── Sales Trend ──
            setSalesTrend(buildSalesTrend(safeOrders, period))

            // ── Product Performance ──
            const perf = buildProductPerformance(allItems)
            setProducts(perf)

            // ── Product Matrix ──
            setMatrix(buildProductMatrix(perf))

            // ── Customer Insights ──
            setCustomers(buildCustomerInsights(safeOrders))

            // ── Forecast (simple linear from all-time for context) ──
            try {
                const { data: forecastData } = await supabase.from('view_analytics_forecast').select('*').single()
                if (forecastData) {
                    setForecast({
                        predicted_revenue: forecastData.predicted_revenue_tomorrow || 0,
                        predicted_transactions: forecastData.predicted_transactions_tomorrow || 0
                    })
                }
            } catch (_) { /* forecast view optional */ }

            // Store all orders for export
            if (!from) setAllOrders(safeOrders)

        } catch (err) {
            console.error('Error fetching analytics:', err)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [period])

    useEffect(() => { fetchAnalytics() }, [fetchAnalytics])

    const handleExportAndReset = async () => {
        try {
            const { data: rawOrders, error } = await supabase
                .from('orders')
                .select('*, order_items(*)')
                .order('created_at', { ascending: false })
            if (error) throw error

            const summarySheet = [
                { Metric: 'Total Revenue (All Time)', Value: rawOrders.reduce((s, o) => s + Number(o.total_amount || 0), 0) },
                { Metric: 'Total Orders (All Time)', Value: rawOrders.length },
                { Metric: 'Predicted Revenue (Tomorrow)', Value: forecast.predicted_revenue },
                { Metric: 'Predicted Transactions (Tomorrow)', Value: forecast.predicted_transactions }
            ]

            const flattenedOrders = []
            rawOrders.forEach(order => {
                if (order.order_items && order.order_items.length > 0) {
                    order.order_items.forEach(item => {
                        flattenedOrders.push({
                            OrderID: order.id,
                            Date: new Date(order.created_at).toLocaleDateString('id-ID'),
                            Time: new Date(order.created_at).toLocaleTimeString('id-ID'),
                            CustomerName: order.customer_name,
                            CustomerPhone: order.customer_phone,
                            ProductName: item.name,
                            Quantity: item.quantity,
                            Price: item.price,
                            TotalAmount: item.price * item.quantity,
                            Status: order.status,
                            Notes: order.notes
                        })
                    })
                } else {
                    flattenedOrders.push({
                        OrderID: order.id,
                        Date: new Date(order.created_at).toLocaleDateString('id-ID'),
                        CustomerName: order.customer_name,
                        Total: order.total_amount,
                        Status: order.status
                    })
                }
            })

            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summarySheet), 'Summary')
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(products), 'Product Performance')
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(salesTrend), 'Sales Trend')
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(flattenedOrders), 'All Transactions')
            XLSX.writeFile(wb, `KareemJuice_Report_${new Date().toISOString().split('T')[0]}.xlsx`)

            setShowResetModal(true)
        } catch (err) {
            console.error('Export failed:', err)
            alert('Export gagal. Coba lagi.')
        }
    }

    const confirmReset = async () => {
        setResetting(true)
        try {
            await supabase.from('order_items').delete().neq('id', 0)
            const { error } = await supabase.from('orders').delete().neq('id', 0)
            if (error) throw error
            alert('Database berhasil direset.')
            setShowResetModal(false)
            fetchAnalytics()
        } catch (err) {
            console.error('Reset failed:', err)
            alert('Reset gagal: ' + err.message)
        } finally {
            setResetting(false)
        }
    }

    const periodLabel = PERIODS.find(p => p.key === period)?.label || 'All Time'

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 print:p-0 print:max-w-none">

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                <div>
                    <h1 className="text-2xl font-bold text-stone-800">Business Dashboard</h1>
                    <p className="text-stone-500 text-sm">Overview performa bisnis Kareem Juice</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => fetchAnalytics(true)}
                        className={`flex items-center gap-2 px-3 py-2 bg-white border border-stone-200 text-stone-600 rounded-lg hover:bg-stone-50 transition-colors shadow-sm font-medium text-sm ${refreshing ? 'opacity-60 cursor-not-allowed' : ''}`}
                        disabled={refreshing}
                        title="Refresh data"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 text-stone-600 rounded-lg hover:bg-stone-50 transition-colors shadow-sm font-medium text-sm"
                    >
                        <Printer className="w-4 h-4" />
                        <span className="hidden sm:inline">Print / PDF</span>
                    </button>
                    <button
                        onClick={handleExportAndReset}
                        className="flex items-center gap-2 px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-900 transition-colors shadow-sm font-medium text-sm"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Export & Reset</span>
                    </button>
                </div>
            </div>

            {/* ── Period Tabs ── */}
            <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-xl w-fit print:hidden">
                {PERIODS.map(p => (
                    <button
                        key={p.key}
                        onClick={() => setPeriod(p.key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${period === p.key
                            ? 'bg-white text-stone-800 shadow-sm'
                            : 'text-stone-500 hover:text-stone-700'
                            }`}
                    >
                        {p.icon}
                        {p.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3 text-stone-400">
                    <div className="w-8 h-8 border-2 border-stone-200 border-t-emerald-500 rounded-full animate-spin"></div>
                    <span className="text-sm">Memuat data analytics...</span>
                </div>
            ) : (
                <>
                    {/* ── KPI Cards ── */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                        <KPICard
                            title="Total Revenue"
                            value={`Rp ${summary.total_revenue.toLocaleString('id-ID')}`}
                            iconName="dollar"
                            period={periodLabel}
                        />
                        <KPICard
                            title="Total Orders"
                            value={summary.total_orders.toLocaleString('id-ID')}
                            iconName="bag"
                            period={periodLabel}
                        />
                        <KPICard
                            title="Avg. Order Value"
                            value={`Rp ${Math.round(summary.overall_aov).toLocaleString('id-ID')}`}
                            iconName="activity"
                            period={periodLabel}
                        />
                        <KPICard
                            title="Forecast Besok"
                            value={`Rp ${Math.round(forecast.predicted_revenue).toLocaleString('id-ID')}`}
                            subtext={`${Math.round(forecast.predicted_transactions)} transaksi`}
                            iconName="activity"
                            period="Prediksi"
                        />
                    </div>

                    {/* ── Charts Row ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-base font-bold text-stone-800">Trend Penjualan</h2>
                                <span className="text-xs font-medium text-stone-400 bg-stone-50 px-2.5 py-1 rounded-full">{periodLabel}</span>
                            </div>
                            <SalesTrendChart data={salesTrend} period={period} />
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-base font-bold text-stone-800">Matriks Produk</h2>
                                <span className="text-xs font-medium text-stone-400 bg-stone-50 px-2.5 py-1 rounded-full">{periodLabel}</span>
                            </div>
                            <ProductMatrixChart data={matrix} />
                        </div>
                    </div>

                    {/* ── Tables Row ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        <div className="lg:col-span-2 bg-white p-5 rounded-2xl shadow-sm border border-stone-100">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-base font-bold text-stone-800">Performa Produk</h2>
                                <span className="text-xs font-medium text-stone-400 bg-stone-50 px-2.5 py-1 rounded-full">{periodLabel}</span>
                            </div>
                            <ProductPerformanceTable data={products} />
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-base font-bold text-stone-800">Pelanggan Loyal</h2>
                                <span className="text-xs font-medium text-stone-400 bg-stone-50 px-2.5 py-1 rounded-full">{periodLabel}</span>
                            </div>
                            <CustomerTable data={customers} />
                        </div>
                    </div>
                </>
            )}

            {/* ── Reset Modal ── */}
            {showResetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:hidden">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
                        <div className="flex items-center gap-3 text-red-600 mb-4">
                            <AlertTriangle className="w-8 h-8" />
                            <h3 className="text-xl font-bold">Reset Database?</h3>
                        </div>
                        <p className="text-stone-600 mb-6">
                            File Excel telah diunduh.<br /><br />
                            Apakah Anda yakin ingin <strong>MENGHAPUS SEMUA DATA PENJUALAN</strong> dari database?<br />
                            Tindakan ini tidak dapat dibatalkan. Menu dan Kategori <strong>TIDAK</strong> akan terhapus.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowResetModal(false)}
                                className="px-4 py-2 text-stone-600 font-medium hover:bg-stone-50 rounded-lg"
                                disabled={resetting}
                            >
                                Batal
                            </button>
                            <button
                                onClick={confirmReset}
                                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 flex items-center gap-2"
                                disabled={resetting}
                            >
                                {resetting ? 'Menghapus...' : 'Ya, Hapus Semua'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
