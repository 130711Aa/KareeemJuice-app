import { useState, useMemo } from 'react'
import ProductCard from '../components/ProductCard'
import { useCategories } from '../context/CategoriesContext'
import { useProducts } from '../context/ProductsContext'
import { useCart } from '../context/CartContext'
import { formatRupiah } from '../lib/utils'

export default function MenuPage() {
    const { filterCategories } = useCategories()
    const { availableProducts } = useProducts()
    const { totalItems, totalPrice, setIsOpen } = useCart()
    const [selectedCategory, setSelectedCategory] = useState('Semua')
    const [searchQuery, setSearchQuery] = useState('')

    const filteredProducts = useMemo(() => {
        let products = availableProducts
        if (selectedCategory !== 'Semua') {
            products = products.filter(p => p.category === selectedCategory)
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase()
            products = products.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q)
            )
        }
        return products
    }, [selectedCategory, searchQuery, availableProducts])

    return (
        <main className="flex flex-1 flex-col min-h-screen bg-[#faf8f5]">
            {/* Hero Banner — compact on mobile, full on desktop */}
            <div className="px-4 md:px-8 pt-4 md:pt-0">
                <div className="rounded-2xl relative bg-gradient-to-br from-[#ff8c00] via-[#ff9b20] to-[#ff6b00] px-5 md:px-8 py-6 md:py-16 overflow-hidden">
                    {/* Decorative */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-10 -right-10 w-40 md:w-64 h-40 md:h-64 bg-white/5 rounded-full blur-2xl"></div>
                        <div className="absolute bottom-0 left-0 w-60 md:w-96 h-60 md:h-96 bg-white/5 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>
                        <div className="absolute top-4 right-4 md:top-8 md:right-12 text-4xl md:text-8xl opacity-20 select-none">🍊</div>
                        <div className="absolute bottom-2 left-4 md:bottom-8 md:left-16 text-3xl md:text-7xl opacity-15 select-none">🥭</div>
                    </div>
                    <div className="relative z-10">
                        <span className="inline-block bg-white/20 backdrop-blur-sm text-white px-3 py-1 md:px-4 md:py-1.5 rounded-full text-xs md:text-sm font-semibold mb-2 md:mb-4">
                            🧃 Fresh & Ready to Go!
                        </span>
                        <h1 className="text-xl md:text-5xl font-black tracking-tight text-white mb-1 md:mb-3 leading-tight">
                            Segarnya Tiada Tara!
                        </h1>
                        <p className="text-white/80 text-xs md:text-lg max-w-lg leading-relaxed">
                            Pilih jus segar, smoothies, atau mocktails favoritmu.
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-4 md:py-8 pb-28 md:pb-8">
                {/* Search */}
                <div className="mb-4 md:mb-6">
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 md:pl-4 text-neutral-400">
                            <span className="material-symbols-outlined text-xl">search</span>
                        </span>
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="block w-full h-10 md:h-12 bg-white border border-[#ff8c00]/10 rounded-xl pl-10 md:pl-12 pr-4 text-[#181510] placeholder:text-neutral-400 focus:ring-2 focus:ring-[#ff8c00]/30 text-sm outline-none transition-all shadow-sm"
                            placeholder="Cari minuman..."
                        />
                    </div>
                </div>

                {/* Category Pills */}
                <div className="flex gap-2 mb-5 md:mb-8 overflow-x-auto pb-1 custom-scrollbar -mx-1 px-1">
                    {filterCategories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 md:px-5 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap transition-all ${selectedCategory === cat
                                ? 'bg-[#ff8c00] text-white shadow-md shadow-[#ff8c00]/20'
                                : 'bg-white text-neutral-500 hover:bg-[#ff8c00]/10 border border-neutral-200'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Products Grid — 2 cols mobile, 3-4 cols desktop */}
                {filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 md:py-20 bg-white rounded-2xl border-2 border-dashed border-[#ff8c00]/20">
                        <span className="material-symbols-outlined text-5xl md:text-6xl text-[#ff8c00]/20 mb-3">search_off</span>
                        <h3 className="text-lg md:text-xl font-bold text-neutral-400">Produk tidak ditemukan</h3>
                        <p className="text-neutral-400 text-xs md:text-sm mt-1">Coba ubah pencarian atau filter kamu.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                        {filteredProducts.map((product, idx) => (
                            <ProductCard key={product.id} product={product} index={idx} />
                        ))}
                    </div>
                )}

                {/* Footer Info — desktop only */}
                <div className="hidden md:block mt-16 mb-8 text-center">
                    <div className="bg-white rounded-2xl border border-[#ff8c00]/10 p-8 shadow-sm">
                        <div className="flex items-center justify-center gap-3">
                            <div className="size-12 rounded-xl bg-[#ff8c00]/10 text-[#ff8c00] flex items-center justify-center">
                                <span className="material-symbols-outlined">verified</span>
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold">Fresh & Berkualitas</p>
                                <p className="text-xs text-neutral-500">100% buah segar</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Bottom Cart Bar — mobile only */}
            {totalItems > 0 && (
                <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-2 bg-gradient-to-t from-[#faf8f5] via-[#faf8f5] to-transparent">
                    <button
                        onClick={() => setIsOpen(true)}
                        className="w-full bg-[#ff8c00] text-white rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-xl shadow-[#ff8c00]/30 active:scale-[0.98] transition-transform"
                    >
                        <div className="flex items-center gap-3">
                            <div className="size-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined">shopping_bag</span>
                            </div>
                            <div className="text-left">
                                <p className="text-xs text-white/70 font-medium">{totalItems} item</p>
                                <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Lihat Keranjang</p>
                            </div>
                        </div>
                        <span className="text-lg font-black">{formatRupiah(totalPrice)}</span>
                    </button>
                </div>
            )}
        </main>
    )
}
