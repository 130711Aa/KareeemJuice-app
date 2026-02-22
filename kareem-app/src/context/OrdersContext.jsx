import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const OrdersContext = createContext()

export function OrdersProvider({ children }) {
    const { user } = useAuth()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)

    // Fetch orders from Supabase on mount
    useEffect(() => {
        if (!user) {
            setOrders([])
            setLoading(false)
            return
        }
        fetchOrders()
    }, [user]) // Re-fetch when user changes

    // Persistence Effect
    useEffect(() => {
        if (!loading && orders.length > 0) {
            try {
                // Only persist the 20 most recent orders to avoid QuotaExceededError
                const ordersToCache = orders.slice(0, 20)
                localStorage.setItem('kareeem_orders', JSON.stringify(ordersToCache))
            } catch (err) {
                console.warn('Failed to save orders to localStorage (Quota Exceeded):', err)
            }
        } else if (!loading && orders.length === 0) {
            // Optional: clear if empty? Or keep?
            // localStorage.removeItem('kareeem_orders')
        }
    }, [orders, loading])

    // Retry protection: prevent rapid cascade retries
    const fetchCooldownRef = { current: false }

    const fetchOrders = async () => {
        // Prevent cascade retries
        if (fetchCooldownRef.current) {
            console.warn('Fetch orders skipped — cooldown active')
            setLoading(false)
            return
        }

        let supabaseData = []
        let fetchError = null

        try {
            // Only fetch today's orders to keep query fast
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            // AbortController with 15s timeout to prevent hanging
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 15000)

            const { data, error } = await supabase
                .from('orders')
                .select('id,order_number,customer_name,customer_phone,customer_address,notes,total_amount,payment_method,items,status,created_at,user_id')
                .gte('created_at', today.toISOString())
                .order('created_at', { ascending: false })
                .limit(50)
                .abortSignal(controller.signal)

            clearTimeout(timeoutId)

            if (error) throw error
            supabaseData = data || []
        } catch (err) {
            console.error('Error fetching orders from Supabase:', err)
            fetchError = err
            // Activate cooldown for 10 seconds to prevent rapid retries
            fetchCooldownRef.current = true
            setTimeout(() => { fetchCooldownRef.current = false }, 10000)
        }

        try {
            const localRaw = localStorage.getItem('kareeem_orders')
            const localOrders = localRaw ? JSON.parse(localRaw) : []

            const isOfflineId = (id) => typeof id === 'number' && id > 1000000000000

            const offlineOrders = localOrders.filter(local => {
                const existsInSupabase = supabaseData.some(sb => sb.id === local.id)
                if (existsInSupabase) return false
                return isOfflineId(local.id)
            })

            const merged = [...supabaseData, ...offlineOrders]
            merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

            setOrders(merged)
        } catch (err) {
            console.error('Error merging local orders:', err)
            setOrders(supabaseData)
        } finally {
            setLoading(false)
        }
    }

    const addOrder = useCallback(async (order) => {
        const orderData = {
            order_number: `KJ-${String(Date.now()).slice(-4)}`,
            customer_name: order.customer_name,
            customer_phone: order.customer_phone,
            customer_address: order.customer_address || '',
            notes: order.notes || '',
            total_amount: order.total_amount,
            payment_method: order.payment_method,
            payment_proof: order.payment_proof || null,
            payment_proof_path: order.payment_proof_path || null,
            items: order.items,
            status: 'pending',
            user_id: user?.id || null, // Link to authenticated user if exists
        }

        try {
            const { data, error } = await supabase
                .from('orders')
                .insert([orderData])
                .select()
                .single()

            if (error) throw error

            if (order.items && order.items.length > 0) {
                const orderItems = order.items.map(item => ({
                    order_id: data.id,
                    product_id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity
                }))

                const { error: itemsError } = await supabase
                    .from('order_items')
                    .insert(orderItems)

                if (itemsError) {
                    console.error('Failed to save order items to relational table:', itemsError)
                }
            }

            setOrders(prev => [data, ...prev])
            return data
        } catch (err) {
            console.error('Error adding order to Supabase:', err)
            const fallbackOrder = {
                ...orderData,
                id: Date.now(),
                created_at: new Date().toISOString(),
                _offline: true
            }
            setOrders(prev => [fallbackOrder, ...prev])
            return fallbackOrder
        }
    }, [user])

    const updateOrderStatus = useCallback(async (orderId, newStatus) => {
        setOrders(prev => prev.map(order =>
            order.id === orderId ? { ...order, status: newStatus } : order
        ))

        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId)

            if (error) throw error
        } catch (err) {
            console.error('Error updating order status:', err)
            fetchOrders()
        }
    }, [])

    const deleteOrder = useCallback(async (orderId) => {
        setOrders(prev => prev.filter(order => order.id !== orderId))

        try {
            const { error } = await supabase
                .from('orders')
                .delete()
                .eq('id', orderId)

            if (error) throw error
        } catch (err) {
            console.error('Error deleting order:', err)
            fetchOrders()
        }
    }, [])

    // Real-time subscription
    useEffect(() => {
        const channel = supabase
            .channel('orders_channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'orders' },
                async (payload) => {
                    console.log('Real-time change received!', payload)

                    if (payload.eventType === 'INSERT') {
                        const { data: newOrder, error } = await supabase
                            .from('orders')
                            .select('*')
                            .eq('id', payload.new.id)
                            .single()

                        if (!error && newOrder) {
                            setOrders(prev => {
                                if (prev.some(o => o.id === newOrder.id)) return prev
                                // Toast only on admin/POS pages (not on customer pages)
                                const isAdminOrPOS = window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/pos')
                                if (isAdminOrPOS) {
                                    toast.success(`Pesanan Baru Masuk! #${newOrder.order_number}`, {
                                        icon: '🔔',
                                        position: 'top-right',
                                        duration: 4000
                                    })
                                }
                                const updated = [newOrder, ...prev]
                                updated.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                                return updated
                            })
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        setOrders(prev => prev.map(order => {
                            if (order.id === payload.new.id) {
                                // Toast only for the customer's own orders
                                if (order.status !== payload.new.status && order.user_id === user?.id) {
                                    const emoji = payload.new.status === 'completed' ? '✅' :
                                        payload.new.status === 'processing' ? '👨‍🍳' :
                                            payload.new.status === 'cancelled' ? '❌' : 'ℹ️';

                                    toast(`Status Pesanan #${order.order_number} Update: ${payload.new.status}`, {
                                        icon: emoji,
                                        position: 'top-center'
                                    })
                                }
                                return { ...order, ...payload.new }
                            }
                            return order
                        }))
                    } else if (payload.eventType === 'DELETE') {
                        setOrders(prev => prev.filter(order => order.id !== payload.old.id))
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user])

    const clearAllOrders = useCallback(async () => {
        setOrders([])
        localStorage.removeItem('kareeem_orders')

        try {
            const { error } = await supabase
                .from('orders')
                .delete()
                .neq('id', 0)

            if (error) throw error
        } catch (err) {
            console.error('Error clearing orders from Supabase:', err)
        }
    }, [])

    return (
        <OrdersContext.Provider value={{ orders, loading, addOrder, updateOrderStatus, deleteOrder, clearAllOrders, refetchOrders: fetchOrders }}>
            {children}
        </OrdersContext.Provider>
    )
}

export function useOrders() {
    const ctx = useContext(OrdersContext)
    if (!ctx) throw new Error('useOrders must be used within OrdersProvider')
    return ctx
}
