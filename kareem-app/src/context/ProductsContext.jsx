import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
// import { sampleProducts as defaultProducts } from '../data/products' // Replaced with DB fetch
import { supabase } from '../lib/supabase'

const ProductsContext = createContext()

export function ProductsProvider({ children }) {
    // Initialize with local storage or defaults to avoid white screen/empty state
    // Initialize with empty state instead of hardcoded data
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)

    // Retry protection
    const productsCooldownRef = useRef(false)

    // Fetch products from Supabase
    const fetchProducts = useCallback(async () => {
        if (productsCooldownRef.current) {
            console.warn('Fetch products skipped — cooldown active')
            return
        }

        setLoading(true)
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 10000)

            const { data, error } = await supabase
                .from('products')
                .select('id,name,description,price,category,stock_status,image_url')
                .order('id', { ascending: true })
                .abortSignal(controller.signal)

            clearTimeout(timeoutId)

            if (error) throw error

            if (data) {
                setProducts(data)
                try {
                    localStorage.setItem('kareeem_products', JSON.stringify(data))
                } catch (e) {
                    // Quota exceeded — not critical, DB is source of truth
                }
            }
        } catch (err) {
            console.error('Error fetching products:', err)
            // Activate cooldown for 10 seconds
            productsCooldownRef.current = true
            setTimeout(() => { productsCooldownRef.current = false }, 10000)
            // We already have fallback data in state, so just log error
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchProducts()
    }, [fetchProducts])

    const save = async (updatedProducts) => {
        // Optimistic update
        setProducts(updatedProducts)
        try {
            localStorage.setItem('kareeem_products', JSON.stringify(updatedProducts))
        } catch (e) {
            // Quota exceeded — safe to ignore
        }

        // Note: Real saving to DB would happen in add/update/delete functions
        // For now we just implement the read part mainly.
        // If you want admin edits to save to DB, we need to update those functions too.
    }

    const toggleStock = useCallback(async (productId) => {
        // Find product to get current status
        const product = products.find(p => p.id === productId)
        if (!product) return

        const newStatus = !product.stock_status

        // Optimistic update
        setProducts(prev => prev.map(p =>
            p.id === productId ? { ...p, stock_status: newStatus } : p
        ))

        try {
            const { error } = await supabase
                .from('products')
                .update({ stock_status: newStatus })
                .eq('id', productId)

            if (error) throw error
        } catch (err) {
            console.error('Error toggling stock:', err)
            // Revert on error
            fetchProducts()
        }
    }, [products, fetchProducts])

    const addProduct = useCallback(async (product) => {
        const newProduct = {
            ...product,
            id: Date.now(), // Generate ID (BigInt compatible)
            // Respect stock_status from caller if provided, otherwise default to true
            stock_status: product.stock_status !== undefined ? product.stock_status : true,
        }

        // Optimistic update
        setProducts(prev => [...prev, newProduct])

        try {
            const { error } = await supabase
                .from('products')
                .insert([newProduct])

            if (error) throw error
        } catch (err) {
            console.error('Error adding product:', err)
            fetchProducts()
        }
        return newProduct
    }, [fetchProducts])

    const deleteProduct = useCallback(async (productId) => {
        // Optimistic update
        setProducts(prev => prev.filter(p => p.id !== productId))

        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', productId)

            if (error) throw error
        } catch (err) {
            console.error('Error deleting product:', err)
            fetchProducts()
        }
    }, [fetchProducts])

    const updateProduct = useCallback(async (productId, updates) => {
        // Optimistic update
        setProducts(prev => prev.map(p =>
            p.id === productId ? { ...p, ...updates } : p
        ))

        try {
            const { error } = await supabase
                .from('products')
                .update(updates)
                .eq('id', productId)

            if (error) throw error
        } catch (err) {
            console.error('Error updating product:', err)
            fetchProducts()
        }
    }, [fetchProducts])

    // Available products (for customer-facing pages)
    const availableProducts = products.filter(p => p.stock_status)

    return (
        <ProductsContext.Provider value={{
            products,
            availableProducts,
            toggleStock,
            addProduct,
            deleteProduct,
            updateProduct,
            loading,
        }}>
            {children}
        </ProductsContext.Provider>
    )
}

export function useProducts() {
    const ctx = useContext(ProductsContext)
    if (!ctx) throw new Error('useProducts must be used within ProductsProvider')
    return ctx
}
