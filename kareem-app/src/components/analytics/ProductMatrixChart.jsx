import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts'

const COLORS = {
    'Star': '#10b981',
    'Fasilitas Arus Kas (Volume)': '#3b82f6',
    'Premium': '#8b5cf6',
    'Perlu Evaluasi (Dead Weight)': '#ef4444'
}

function formatRupiahShort(value) {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}M`
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`
    return `${value}`
}

export default function ProductMatrixChart({ data }) {
    if (!data || data.length === 0) {
        return (
            <div className="h-64 flex flex-col items-center justify-center text-stone-400 gap-2">
                <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="opacity-30">
                    <circle cx="12" cy="12" r="3" /><circle cx="19" cy="5" r="2" /><circle cx="5" cy="19" r="2" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12L19 5M12 12L5 19" />
                </svg>
                <span className="text-sm">Belum ada data matriks produk.</span>
            </div>
        )
    }

    return (
        <div className="h-80 w-full font-sans">
            <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                    <XAxis
                        type="number"
                        dataKey="total_quantity"
                        name="Terjual"
                        unit=" pcs"
                        stroke="#a8a29e"
                        tick={{ fill: '#78716c', fontSize: 11 }}
                        tickLine={false}
                        axisLine={{ stroke: '#e5e5e5' }}
                        label={{ value: 'Jumlah Terjual (pcs)', position: 'insideBottom', offset: -15, fill: '#78716c', fontSize: 11, fontWeight: 500 }}
                    />
                    <YAxis
                        type="number"
                        dataKey="total_revenue"
                        name="Pendapatan"
                        stroke="#a8a29e"
                        width={80}
                        tickFormatter={formatRupiahShort}
                        tick={{ fill: '#78716c', fontSize: 11 }}
                        tickLine={false}
                        axisLine={{ stroke: '#e5e5e5' }}
                        label={{ value: 'Pendapatan', angle: -90, position: 'insideLeft', fill: '#78716c', fontSize: 11, fontWeight: 500, offset: 10 }}
                    />
                    <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const d = payload[0].payload;
                                return (
                                    <div className="bg-white p-3 shadow-xl rounded-xl border border-stone-100 text-xs z-50">
                                        <p className="font-bold text-stone-800 mb-1 text-sm">{d.name}</p>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[d.classification] || '#94a3b8' }}></span>
                                            <span className="text-stone-500 font-medium">{d.classification}</span>
                                        </div>
                                        <div className="space-y-1 bg-stone-50 p-2 rounded-lg">
                                            <div className="flex justify-between gap-4">
                                                <span className="text-stone-500">Terjual:</span>
                                                <span className="font-mono font-medium text-stone-700">{d.total_quantity} pcs</span>
                                            </div>
                                            <div className="flex justify-between gap-4">
                                                <span className="text-stone-500">Revenue:</span>
                                                <span className="font-mono font-medium text-emerald-600">Rp {d.total_revenue.toLocaleString('id-ID')}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Scatter name="Produk" data={data} fill="#8884d8" shape="circle">
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[entry.classification] || '#94a3b8'} stroke="white" strokeWidth={2} />
                        ))}
                    </Scatter>
                </ScatterChart>
            </ResponsiveContainer>

            <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-1 text-[10px] md:text-xs text-stone-500 uppercase tracking-wider font-medium">
                {Object.entries(COLORS).map(([name, color]) => (
                    <div key={name} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm" style={{ backgroundColor: color }}></div>
                        <span>{name.replace(' (Volume)', '').replace(' (Dead Weight)', '')}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
