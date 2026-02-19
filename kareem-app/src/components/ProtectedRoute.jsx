import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
    const { isAdmin, loading } = useAuth()

    if (loading) return null // Or a spinner

    if (!isAdmin) {
        return <Navigate to="/auth" replace />
    }

    return children
}
