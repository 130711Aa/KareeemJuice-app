import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const CategoriesContext = createContext()

const DEFAULT_CATEGORIES = ['Jus Segar', 'Smoothies', 'Mocktails']

export function CategoriesProvider({ children }) {
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchCategories = useCallback(async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('name')
                .order('created_at', { ascending: true })

            if (error) throw error

            if (data && data.length > 0) {
                setCategories(data.map(c => c.name))
            } else {
                // Table is empty, seed defaults automatically
                if (import.meta.env.DEV) console.log('Seeding default categories...')
                const { error: insertError } = await supabase
                    .from('categories')
                    .insert(DEFAULT_CATEGORIES.map(name => ({ name })))

                if (!insertError) {
                    setCategories(DEFAULT_CATEGORIES)
                } else {
                    console.error('Error seeding defaults:', insertError)
                    // Fallback to defaults locally if seed fails
                    setCategories(DEFAULT_CATEGORIES)
                }
            }
        } catch (err) {
            console.error('Error fetching categories:', err)
            // Fallback to local storage or defaults on error
            const stored = localStorage.getItem('kareeem_categories')
            setCategories(stored ? JSON.parse(stored) : DEFAULT_CATEGORIES)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchCategories()
    }, [fetchCategories])

    const addCategory = useCallback(async (name) => {
        const trimmed = name.trim()
        if (!trimmed) return { success: false, error: 'Nama tidak boleh kosong' }

        // Optimistic check
        if (categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
            return { success: false, error: 'Kategori sudah ada' }
        }

        // Optimistic update
        setCategories(prev => [...prev, trimmed])

        try {
            const { error } = await supabase
                .from('categories')
                .insert([{ name: trimmed }])

            if (error) throw error

            // Re-fetch to confirm and sync (optional, but safer)
            // fetchCategories() 
            return { success: true }
        } catch (err) {
            console.error('Error adding category:', err)
            // Revert on error
            fetchCategories()
            return { success: false, error: 'Gagal menyimpan kategori ke server' }
        }
    }, [categories, fetchCategories])

    const deleteCategory = useCallback(async (name) => {
        // Optimistic update
        setCategories(prev => prev.filter(c => c !== name))

        try {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('name', name)

            if (error) throw error
        } catch (err) {
            console.error('Error deleting category:', err)
            // Revert on error
            fetchCategories()
        }
    }, [fetchCategories])

    // Categories with "Semua" prepended for filter UI
    const filterCategories = ['Semua', ...categories]

    return (
        <CategoriesContext.Provider value={{ categories, filterCategories, addCategory, deleteCategory, loading }}>
            {children}
        </CategoriesContext.Provider>
    )
}

export function useCategories() {
    const ctx = useContext(CategoriesContext)
    if (!ctx) throw new Error('useCategories must be used within CategoriesProvider')
    return ctx
}
