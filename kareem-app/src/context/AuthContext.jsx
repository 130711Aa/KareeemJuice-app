import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [session, setSession] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)
    const [isRecovering, setIsRecovering] = useState(false)

    useEffect(() => {
        // Check active session
        const initSession = async () => {
            try {
                const { data, error } = await supabase.auth.getSession()
                if (error) throw error

                const session = data?.session ?? null
                setSession(session)
                setUser(session?.user ?? null)
                checkAdmin(session?.user)
            } catch (err) {
                console.error('Auth initialization error:', err)
                // Start with no user if error
                setSession(null)
                setUser(null)
            } finally {
                setLoading(false)
            }
        }
        initSession()

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (import.meta.env.DEV) console.log("Global Auth Event:", event)

            if (event === 'PASSWORD_RECOVERY') {
                setIsRecovering(true)
            }

            setSession(session)
            setUser(session?.user ?? null)
            checkAdmin(session?.user)
            setLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [])

    const checkAdmin = async (user) => {
        if (!user) {
            setIsAdmin(false)
            return
        }
        try {
            const { data, error } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', user.id)
                .eq('role', 'admin')
                .maybeSingle()

            if (error) throw error
            setIsAdmin(!!data)
        } catch (err) {
            console.error('Error checking admin role:', err)
            // Fallback: deny admin access on error
            setIsAdmin(false)
        }
    }

    const login = async (email, password) => {
        setLoading(true)
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })
        setLoading(false)
        if (error) return { success: false, error: error.message }
        return { success: true, data }
    }

    const signup = async (email, password, metaData) => {
        setLoading(true)
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metaData // { name: '...', phone: '...' }
            }
        })
        setLoading(false)
        if (error) return { success: false, error: error.message }
        return { success: true, data }
    }

    const logout = async () => {
        setLoading(true)
        const { error } = await supabase.auth.signOut()
        if (error) console.error('Error signing out:', error)
        setUser(null)
        setSession(null)
        setIsAdmin(false)
        setLoading(false)
    }

    const updatePassword = async (newPassword) => {
        setLoading(true)
        const { data, error } = await supabase.auth.updateUser({
            password: newPassword
        })
        setLoading(false)
        if (error) return { success: false, error: error.message }
        return { success: true, data }
    }

    const value = {
        user,
        session,
        loading,
        isAdmin, // Use the state variable which is set by checkAdmin
        // Compatibility with existing code asking for 'isAuthenticated'
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        updatePassword,
        isRecovering,
        setIsRecovering
    }

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
