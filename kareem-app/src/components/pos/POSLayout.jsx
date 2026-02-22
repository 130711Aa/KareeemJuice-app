import POSTopBar from './POSTopBar'

export default function POSLayout({ children }) {
    return (
        <div className="fixed inset-0 flex flex-col bg-[#f8f7f5] overflow-hidden z-50">
            <POSTopBar />
            <main className="flex flex-1 overflow-hidden">
                {children}
            </main>
            {/* Footer: Shortcut Bar */}
            <footer className="bg-white px-6 py-2 border-t border-slate-200 flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <div className="flex gap-3">
                    <span className="px-2 py-1 rounded-md bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer">🔍 Cari</span>
                    <span className="px-2 py-1 rounded-md bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer">🧾 Order Baru</span>
                    <span className="px-2 py-1 rounded-md bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer">🖨️ Cetak Nota</span>
                </div>
                <div className="flex items-center">
                    Kareeem Juice POS v1.0
                </div>
            </footer>
        </div>
    )
}
