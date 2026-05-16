export default function ProductPerformanceTable({ data }) {
    if (!data || data.length === 0) {
        return (
            <div className="py-10 flex flex-col items-center justify-center text-stone-400 gap-2">
                <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="opacity-30">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span className="text-sm">Belum ada data penjualan produk.</span>
            </div>
        )
    }

    const sortedData = [...data].sort((a, b) => b.total_revenue - a.total_revenue)
    const maxRevenue = sortedData[0]?.total_revenue || 1

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-stone-50 text-stone-500 font-medium uppercase text-xs">
                    <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Produk</th>
                        <th className="px-4 py-3 text-right">Terjual</th>
                        <th className="px-4 py-3 text-right rounded-tr-lg">Pendapatan</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                    {sortedData.map((item, index) => (
                        <tr key={index} className="hover:bg-stone-50/50 transition-colors">
                            <td className="px-4 py-3">
                                <div className="flex flex-col gap-1">
                                    <span className="font-medium text-stone-800">{item.name}</span>
                                    {/* Revenue bar */}
                                    <div className="h-1 rounded-full bg-stone-100 w-full max-w-[160px]">
                                        <div
                                            className="h-1 rounded-full bg-emerald-400"
                                            style={{ width: `${Math.round((item.total_revenue / maxRevenue) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-right text-stone-600 font-mono">
                                {item.total_quantity.toLocaleString('id-ID')}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-emerald-600 font-mono whitespace-nowrap">
                                Rp {item.total_revenue.toLocaleString('id-ID')}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
