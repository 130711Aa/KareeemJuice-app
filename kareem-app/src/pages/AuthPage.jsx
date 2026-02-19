import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-hot-toast'

export default function AuthPage() {
    const [mode, setMode] = useState('login') // 'login' or 'register'
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const { login, signup, loading } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!email.trim() || !password.trim()) {
            toast.error('Email dan password wajib diisi!')
            return
        }

        if (mode === 'register' && (!name.trim() || !phone.trim())) {
            toast.error('Nama dan No. HP wajib diisi!')
            return
        }

        let result
        if (mode === 'login') {
            result = await login(email, password)
        } else {
            result = await signup(email, password, { name, phone })
        }

        if (result.success) {
            // Check if we have a session (Auto Confirm enabled)
            if (result.data?.session) {
                toast.success('Berhasil masuk!')
                if (email === 'admin@kareeemjuice.com') {
                    navigate('/admin')
                } else {
                    navigate('/')
                }
            } else {
                toast.success(mode === 'login' ? 'Berhasil masuk!' : 'Registrasi berhasil! Silakan cek email untuk verifikasi.')
                if (mode === 'login' && email === 'admin@kareeemjuice.com') {
                    navigate('/admin')
                } else if (mode === 'login') {
                    navigate('/')
                }
            }
        } else {
            toast.error(result.error || 'Terjadi kesalahan')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fcfaf8] to-[#fff3e6] px-4 py-10">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-6">
                    <button onClick={() => navigate('/')} className="inline-flex size-14 bg-[#ff8c00] rounded-2xl items-center justify-center text-white shadow-xl shadow-[#ff8c00]/25 mb-4 hover:scale-105 transition-transform">
                        <span className="material-symbols-outlined text-3xl">local_drink</span>
                    </button>
                    <h1 className="text-2xl font-black tracking-tight text-[#181510]">Kareeem Juice</h1>
                    <p className="text-sm text-neutral-500 mt-1">Nikmati kesegaran jus terbaik!</p>
                </div>

                {/* Auth Card */}
                <div className="bg-white rounded-2xl border border-[#ff8c00]/10 shadow-xl shadow-black/5 overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-[#ff8c00]/10">
                        <button
                            className={`flex-1 py-4 text-sm font-bold transition-colors ${mode === 'login' ? 'bg-[#ff8c00]/5 text-[#ff8c00]' : 'text-neutral-400 hover:text-neutral-600'}`}
                            onClick={() => setMode('login')}
                        >
                            Masuk
                        </button>
                        <button
                            className={`flex-1 py-4 text-sm font-bold transition-colors ${mode === 'register' ? 'bg-[#ff8c00]/5 text-[#ff8c00]' : 'text-neutral-400 hover:text-neutral-600'}`}
                            onClick={() => setMode('register')}
                        >
                            Daftar
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-4">
                        {mode === 'register' && (
                            <>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-neutral-600">Nama Lengkap</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full px-4 py-3 bg-[#fcfaf8] border border-[#ff8c00]/10 rounded-xl text-sm focus:ring-2 focus:ring-[#ff8c00]/30 outline-none"
                                        placeholder="Nama kamu"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-neutral-600">No. WhatsApp</label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        className="w-full px-4 py-3 bg-[#fcfaf8] border border-[#ff8c00]/10 rounded-xl text-sm focus:ring-2 focus:ring-[#ff8c00]/30 outline-none"
                                        placeholder="08xxxxxxxx"
                                    />
                                </div>
                            </>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-neutral-600">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-[#fcfaf8] border border-[#ff8c00]/10 rounded-xl text-sm focus:ring-2 focus:ring-[#ff8c00]/30 outline-none"
                                placeholder="nama@email.com"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-neutral-600">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-[#fcfaf8] border border-[#ff8c00]/10 rounded-xl text-sm focus:ring-2 focus:ring-[#ff8c00]/30 outline-none pr-10"
                                    placeholder="minimal 6 karakter"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#ff8c00]"
                                >
                                    <span className="material-symbols-outlined text-lg">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#ff8c00] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-[#e67e00] transition-all shadow-lg shadow-[#ff8c00]/20 mt-4 disabled:opacity-60"
                        >
                            {loading ? 'Memproses...' : (mode === 'login' ? 'Masuk Sekarang' : 'Daftar Sekarang')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
