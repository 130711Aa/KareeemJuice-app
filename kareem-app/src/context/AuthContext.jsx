import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

// Simple credential-based auth for the store owner
const ADMIN_EMAIL = 'admin@kareeemjuice.com'
const ADMIN_PASSWORD = 'kareeem2024'

export function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return localStorage.getItem('kareeem_admin_auth') === 'true'
    })
    const [loading, setLoading] = useState(false)

    const login = async (email, password) => {
        setLoading(true)
        // Simulate a small delay for UX
        await new Promise(resolve => setTimeout(resolve, 500))

        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            setIsAuthenticated(true)
            localStorage.setItem('kareeem_admin_auth', 'true')
            setLoading(false)
            return { success: true }
        }
        setLoading(false)
        return { success: false, error: 'Email atau password salah!' }
    }

    const logout = () => {
        setIsAuthenticated(false)
        localStorage.removeItem('kareeem_admin_auth')
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
