import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
    const { isAdmin, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fcfaf8]">
                <div className="flex flex-col items-center gap-3">
                    <span className="animate-spin material-symbols-outlined text-[#ff8c00] text-4xl">progress_activity</span>
                    <p className="text-slate-400 text-sm font-medium">Memuat...</p>
                </div>
            </div>
        )
    }

    if (!isAdmin) {
        return <Navigate to="/auth" replace />
    }

    return children
}
