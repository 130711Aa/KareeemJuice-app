import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const StoreStatusContext = createContext()

export function StoreStatusProvider({ children }) {
    const [isStoreOpen, setIsStoreOpen] = useState(true)
    const [loading, setLoading] = useState(true)

    // Fetch initial store status
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const { data, error } = await supabase
                    .from('store_settings')
                    .select('is_open')
                    .limit(1)
                    .maybeSingle()

                if (error) throw error
                if (data) setIsStoreOpen(data.is_open)
            } catch (err) {
                console.warn('Could not fetch store status:', err)
                // Default to open if table doesn't exist yet
                setIsStoreOpen(true)
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
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const toggleStore = useCallback(async () => {
        const newStatus = !isStoreOpen
        // Optimistic update
        setIsStoreOpen(newStatus)

        try {
            const { error } = await supabase
                .from('store_settings')
                .update({ is_open: newStatus, updated_at: new Date().toISOString() })
                .neq('is_open', null)

            if (error) throw error
        } catch (err) {
            console.error('Failed to toggle store status:', err)
            // Revert on error
            setIsStoreOpen(!newStatus)
        }
    }, [isStoreOpen])

    return (
        <StoreStatusContext.Provider value={{ isStoreOpen, toggleStore, loading }}>
            {children}
        </StoreStatusContext.Provider>
    )
}

export function useStoreStatus() {
    const ctx = useContext(StoreStatusContext)
    if (!ctx) throw new Error('useStoreStatus must be used within StoreStatusProvider')
    return ctx
}
