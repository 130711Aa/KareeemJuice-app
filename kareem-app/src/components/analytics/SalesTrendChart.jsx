import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'

function formatRupiah(value) {
    if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)}M`
    if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}jt`
    if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}rb`
    return `Rp ${value}`
}

export default function SalesTrendChart({ data, period }) {
    if (!data || data.length === 0) {
        return (
            <div className="h-64 flex flex-col items-center justify-center text-stone-400 gap-2">
                <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="opacity-30">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3v18h18M7 16l4-4 4 4 4-4" />
                </svg>
                <span className="text-sm">Belum ada data trend penjualan.</span>
            </div>
        )
    }

    // Determine x-axis key based on period
    const xKey = period === 'day' ? 'hour_label' : period === 'week' ? 'day_label' : period === 'month' ? 'date_label' : 'month_label'

    return (
        <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorRevenueTrend" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                    <XAxis
                        dataKey={xKey}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#78716c', fontSize: 11 }}
                        dy={8}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#78716c', fontSize: 11 }}
                        tickFormatter={formatRupiah}
                        width={72}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow: '0 8px 24px -4px rgba(0,0,0,0.12)',
                            padding: '10px 14px'
                        }}
                        labelStyle={{ fontWeight: 600, color: '#292524', marginBottom: 4, fontSize: 13 }}
                        formatter={(value) => [`Rp ${value.toLocaleString('id-ID')}`, 'Pendapatan']}
                    />
                    <Area
                        type="monotone"
                        dataKey="total_revenue"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorRevenueTrend)"
                        dot={data.length <= 15 ? { r: 3, fill: '#10b981', strokeWidth: 0 } : false}
                        activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
