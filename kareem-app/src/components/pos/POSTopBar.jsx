import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import BackToAdminButton from './BackToAdminButton'

export default function POSTopBar() {
    const { user } = useAuth()
    const [clock, setClock] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setClock(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    const cashierName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Kasir'

    const formattedTime = clock.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    })

    const formattedDate = clock.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })

    return (
        <header className="flex items-center justify-between bg-white px-6 py-3 border-b border-slate-200 sticky top-0 z-50">
            {/* Left: Back + Brand */}
            <div className="flex items-center gap-4">
                <BackToAdminButton />
                <div className="h-8 w-px bg-slate-200" />
                <div className="flex items-center gap-3">
                    <div className="bg-[#ff8c00] p-2 rounded-lg text-white shadow-lg shadow-[#ff8c00]/20">
                        <span className="material-symbols-outlined text-2xl">local_drink</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900">Kareeem Juice</h1>
                        <p className="text-xs text-slate-500 font-medium">Mode Kasir — POS</p>
                    </div>
                </div>
            </div>

            {/* Right: Cashier + Clock */}
            <div className="flex items-center gap-8">
                <div className="hidden md:flex flex-col items-end">
                    <span className="text-sm font-semibold text-slate-700">{cashierName}</span>
                    <span className="text-xs text-slate-500">Kasir Aktif</span>
                </div>
                <div className="hidden lg:flex flex-col items-end border-l border-slate-200 pl-8">
                    <span className="text-sm font-medium text-slate-700">{formattedDate}</span>
                    <span className="text-xs text-slate-500 tabular-nums">{formattedTime}</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#ff8c00]/10 flex items-center justify-center border-2 border-white shadow-sm">
                    <span className="material-symbols-outlined text-[#ff8c00]">person</span>
                </div>
            </div>
        </header>
    )
}
