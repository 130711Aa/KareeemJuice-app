import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const StoreStatusContext = createContext()

export function StoreStatusProvider({ children }) {
    const [isStoreOpen, setIsStoreOpen] = useState(true)
    const [webOrderingEnabled, setWebOrderingEnabled] = useState(true)
    const [loading, setLoading] = useState(true)

    // Fetch initial store status
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const { data, error } = await supabase
                    .from('store_settings')
                    .select('is_open, web_ordering_enabled')
                    .limit(1)
                    .maybeSingle()

                if (error) throw error
                if (data) {
                    setIsStoreOpen(data.is_open)
                    // Fallback ke true jika kolom belum ada di DB
                    setWebOrderingEnabled(data.web_ordering_enabled ?? true)
                }
            } catch (err) {
                console.warn('Could not fetch store status:', err)
                setIsStoreOpen(true)
                setWebOrderingEnabled(true)
            } finally {
                setLoading(false)
            }
        }

        fetchStatus()

        // Subscribe to realtime changes
        const channel = supabase
            .channel('store_settings_changes')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'store_settings' },
                (payload) => {
                    if (payload.new && typeof payload.new.is_open === 'boolean') {
                        setIsStoreOpen(payload.new.is_open)
                    }
                    if (payload.new && typeof payload.new.web_ordering_enabled === 'boolean') {
                        setWebOrderingEnabled(payload.new.web_ordering_enabled)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const toggleStore = useCallback(async () => {
        const newStatus = !isStoreOpen
        setIsStoreOpen(newStatus)

        try {
            const { error } = await supabase
                .from('store_settings')
                .update({ is_open: newStatus, updated_at: new Date().toISOString() })
                .not('id', 'is', null)

            if (error) throw error
        } catch (err) {
            console.error('Failed to toggle store status:', err)
            setIsStoreOpen(!newStatus)
        }
    }, [isStoreOpen])

    const toggleWebOrdering = useCallback(async () => {
        const newStatus = !webOrderingEnabled
        setWebOrderingEnabled(newStatus)

        try {
            const { error } = await supabase
                .from('store_settings')
                .update({ web_ordering_enabled: newStatus, updated_at: new Date().toISOString() })
                .not('id', 'is', null)

            if (error) throw error
        } catch (err) {
            console.error('Failed to toggle web ordering:', err)
            setWebOrderingEnabled(!newStatus)
        }
    }, [webOrderingEnabled])

    return (
        <StoreStatusContext.Provider value={{ isStoreOpen, toggleStore, webOrderingEnabled, toggleWebOrdering, loading }}>
            {children}
        </StoreStatusContext.Provider>
    )
}

export function useStoreStatus() {
    const ctx = useContext(StoreStatusContext)
    if (!ctx) throw new Error('useStoreStatus must be used within StoreStatusProvider')
    return ctx
}
