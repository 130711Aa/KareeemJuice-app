import { useOrders } from '../context/OrdersContext'
import { formatRupiah } from '../lib/utils'
import { Link } from 'react-router-dom'

export default function CustomerOrdersPage() {
    const { orders, loading } = useOrders()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#faf8f5]">
                <span className="material-symbols-outlined text-4xl text-[#ff8c00] animate-spin">progress_activity</span>
            </div>
        )
    }

    if (orders.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf8f5] px-4">
                <div className="size-20 bg-[#ff8c00]/10 rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-4xl text-[#ff8c00]">receipt_long</span>
                </div>
                <h2 className="text-xl font-bold text-neutral-800 mb-2">Belum ada pesanan</h2>
                <p className="text-neutral-500 text-center mb-8 max-w-xs">
                    Kamu belum pernah memesan sebelumnya. Yuk, pesan minum yang segar!
                </p>
                <Link to="/" className="bg-[#ff8c00] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#e67e00] transition-colors shadow-lg shadow-[#ff8c00]/20">
                    Pesan Sekarang
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#faf8f5] pb-20">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-[#ff8c00]/10 px-4 py-4">
                <div className="max-w-md mx-auto flex items-center gap-3">
                    <Link to="/" className="size-10 rounded-xl bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </Link>
                    <h1 className="text-lg font-bold">Pesanan Saya</h1>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 py-6 space-y-4">
                {orders.map(order => (
                    <div key={order.id} className="bg-white rounded-2xl p-5 border border-[#ff8c00]/10 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${order.status === 'completed' ? 'bg-green-50 text-green-600 border-green-200' :
                                            order.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-200' :
                                                'bg-blue-50 text-blue-600 border-blue-200'
                                        }`}>
                                        {order.status === 'pending' ? 'Menunggu' :
                                            order.status === 'processing' ? 'Diproses' :
                                                order.status === 'ready' ? 'Siap Diambil' :
                                                    order.status === 'completed' ? 'Selesai' :
                                                        order.status === 'cancelled' ? 'Dibatalkan' : order.status}
                                    </span>
                                    <span className="text-xs text-neutral-400">
                                        {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <h3 className="font-bold text-neutral-800">Order #{order.order_number || order.id.toString().slice(-4)}</h3>
                            </div>
                            <span className="font-bold text-[#ff8c00]">{formatRupiah(order.total_amount)}</span>
                        </div>

                        <div className="space-y-2 mb-4">
                            {/* Assuming we might fetch items separately or they are included. 
                                OrdersContext implementation suggests items are stored in a separate table but joined?
                                Actually, fetchOrders in OrdersContext selects '*', it might NOT include items if not joined.
                                Let's check if items are fetched. If not, we might need to rely on order summarization or fetch them.
                                Checking previous context: OrdersContext fetches 'orders' table. Items are in 'order_items'.
                                The current fetchOrders does NOT join items.
                                However, for simple display, maybe we just show total items count or "Lihat Detail" if we can't show items easily without huge refactor.
                                
                                Wait, addOrder puts items in 'order_items'.
                                fetchOrders only selects from 'orders'.
                                
                                We should update OrdersContext to fetch items OR just show limited info here.
                                For now, let's show "x Item" based on total_amount estimate or just "Lihat Detail" (but we don't have detail page).
                                
                                Actually, let's keep it simple. Just show Status, Date, Total Amount.
                                If we want to show items, we need to update fetchQuery to join.
                            */}
                            <div className="p-3 bg-neutral-50 rounded-xl text-sm text-neutral-600 flex items-center gap-2">
                                <span className="material-symbols-outlined text-neutral-400">info</span>
                                <span>Detail menu tidak ditampilkan (Mode Ringkas)</span>
                            </div>
                            {order.notes && (
                                <div className="text-xs text-neutral-500 italic bg-yellow-50 p-2 rounded-lg border border-yellow-100">
                                    Catatan: "{order.notes}"
                                </div>
                            )}
                        </div>

                        {/* Action Buttons for active orders? */}
                        {order.payment_method === 'cashless' && order.payment_proof_path && (
                            <div className="mt-3 text-xs text-blue-600 flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                Bukti Bayar Terupload
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
