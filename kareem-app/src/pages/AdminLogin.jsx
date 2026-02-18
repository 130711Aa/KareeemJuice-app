import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminLogin() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const { login, loading } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!email.trim() || !password.trim()) {
            setError('Email dan password wajib diisi!')
            return
        }

        const result = await login(email, password)
        if (result.success) {
            navigate('/admin')
        } else {
            setError(result.error)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fcfaf8] to-[#fff3e6] px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex size-16 bg-[#ff8c00] rounded-2xl items-center justify-center text-white shadow-xl shadow-[#ff8c00]/25 mb-4">
                        <span className="material-symbols-outlined text-3xl">local_drink</span>
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-[#181510]">Kareeem Juice</h1>
                    <p className="text-sm text-neutral-500 mt-1">Masuk ke Admin Panel</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl border border-[#ff8c00]/10 shadow-xl shadow-black/5 p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Error */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 animate-fade-in-up">
                                <span className="material-symbols-outlined text-lg">error</span>
                                {error}
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-bold text-neutral-600 mb-2">Email</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-neutral-400">
                                    <span className="material-symbols-outlined text-xl">mail</span>
                                </span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-[#fcfaf8] border border-[#ff8c00]/10 rounded-xl text-sm focus:ring-2 focus:ring-[#ff8c00]/30 focus:border-[#ff8c00]/30 outline-none transition-all"
                                    placeholder="admin@kareeemjuice.com"
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-bold text-neutral-600 mb-2">Password</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-neutral-400">
                                    <span className="material-symbols-outlined text-xl">lock</span>
                                </span>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-12 py-3.5 bg-[#fcfaf8] border border-[#ff8c00]/10 rounded-xl text-sm focus:ring-2 focus:ring-[#ff8c00]/30 focus:border-[#ff8c00]/30 outline-none transition-all"
                                    placeholder="Masukkan password"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-neutral-400 hover:text-[#ff8c00] transition-colors"
                                >
                                    <span className="material-symbols-outlined text-xl">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#ff8c00] text-white py-3.5 rounded-xl font-bold text-base hover:bg-[#e67e00] transition-all shadow-lg shadow-[#ff8c00]/20 flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98]"
                        >
                            {loading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                                    Memverifikasi...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-lg">login</span>
                                    Masuk
                                </>
                            )}
                        </button>
                    </form>

                    {/* Hint */}
                    <div className="mt-6 pt-5 border-t border-[#ff8c00]/5">
                        <div className="bg-[#ff8c00]/5 rounded-xl p-4">
                            <p className="text-xs text-neutral-500 flex items-start gap-2">
                                <span className="material-symbols-outlined text-[#ff8c00] text-base mt-0.5">info</span>
                                <span>
                                    Halaman ini hanya untuk pemilik usaha. Jika kamu customer, silakan kembali ke{' '}
                                    <a href="/" className="text-[#ff8c00] font-bold hover:underline">halaman utama</a>.
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
