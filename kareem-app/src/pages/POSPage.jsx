import { useState, useEffect, useRef, useCallback } from 'react'
import qrisImage from '/qrcode.jpeg'
import { useProducts } from '../context/ProductsContext'
import { useCategories } from '../context/CategoriesContext'
import { useOrders } from '../context/OrdersContext'
import { useAuth } from '../context/AuthContext'
import { formatRupiah } from '../lib/utils'
import POSLayout from '../components/pos/POSLayout'
import toast from 'react-hot-toast'

export default function POSPage() {
    // Persist POS session
    useEffect(() => {
        sessionStorage.setItem('pos_mode', 'true')
    }, [])

    const { products } = useProducts()
    const { filterCategories } = useCategories()
    const { addOrder } = useOrders()
    const { user } = useAuth()

    // POS-local cart (separate from customer CartContext)
    const [cart, setCart] = useState([])
    const [search, setSearch] = useState('')
    const [activeCategory, setActiveCategory] = useState('Semua')
    const [paymentMethod, setPaymentMethod] = useState('')
    const [customerName, setCustomerName] = useState('')
    const [orderNote, setOrderNote] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)

    // Payment-specific state
    const [cashPaidAmount, setCashPaidAmount] = useState('')
    const [changeAmount, setChangeAmount] = useState(0)
    const [isPaymentValid, setIsPaymentValid] = useState(false)
    const [isQrisGenerated, setIsQrisGenerated] = useState(false)
    const [isPaid, setIsPaid] = useState(false)

    const searchRef = useRef(null)

    // Auto-focus search on mount
    useEffect(() => {
        searchRef.current?.focus()
    }, [])


    // Reset payment-specific state when switching methods
    const handlePaymentMethodChange = (method) => {
        setPaymentMethod(method)
        setCashPaidAmount('')
        setChangeAmount(0)
        setIsQrisGenerated(false)
        setIsPaid(false)
        setIsPaymentValid(false)
    }

    // Filtered products
    const availableProducts = products.filter(p => p.stock_status)
    const outOfStockProducts = products.filter(p => !p.stock_status)

    const filtered = [...availableProducts, ...outOfStockProducts].filter(p => {
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
        const matchCategory = activeCategory === 'Semua' || p.category === activeCategory
        return matchSearch && matchCategory
    })

    // Cart operations
    const addToCart = useCallback((product) => {
        if (!product.stock_status) return
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id)
            if (existing) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            }
            return [...prev, { ...product, quantity: 1 }]
        })
    }, [])

    const updateQuantity = useCallback((productId, delta) => {
        setCart(prev =>
            prev
                .map(item =>
                    item.id === productId
                        ? { ...item, quantity: item.quantity + delta }
                        : item
                )
                .filter(item => item.quantity > 0)
        )
    }, [])

    const removeFromCart = useCallback((productId) => {
        setCart(prev => prev.filter(item => item.id !== productId))
    }, [])

    const clearCart = useCallback(() => {
        setCart([])
        setOrderNote('')
        setCustomerName('')
        setPaymentMethod('')
        setCashPaidAmount('')
        setChangeAmount(0)
        setIsQrisGenerated(false)
        setIsPaid(false)
        setIsPaymentValid(false)
    }, [])

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
    const totalAmount = subtotal

    // Cash change calculation
    useEffect(() => {
        if (paymentMethod === 'cash') {
            const paid = parseInt(cashPaidAmount) || 0
            const change = paid - totalAmount
            setChangeAmount(Math.max(0, change))
            setIsPaymentValid(paid >= totalAmount && totalAmount > 0)
        } else if (paymentMethod === 'qris') {
            setIsPaymentValid(isQrisGenerated)
        } else {
            setIsPaymentValid(false)
        }
    }, [cashPaidAmount, totalAmount, paymentMethod, isQrisGenerated])

    // Currency input handler — numbers only
    const handleCashInput = (e) => {
        const raw = e.target.value.replace(/\D/g, '')
        setCashPaidAmount(raw)
    }

    // Payment
    const handlePayment = async () => {
        if (cart.length === 0) {
            toast.error('Keranjang kosong!')
            return
        }

        // QRIS first click: generate QR code
        if (paymentMethod === 'qris' && !isQrisGenerated) {
            setIsQrisGenerated(true)
            return
        }

        // QRIS second click: confirm payment
        if (paymentMethod === 'qris' && isQrisGenerated && !isPaid) {
            setIsPaid(true)
        }

        setIsProcessing(true)
        try {
            const orderData = {
                customer_name: customerName.trim() || 'Walk-in Customer',
                customer_phone: '-',
                customer_address: '',
                notes: orderNote.trim() || 'POS Order',
                total_amount: totalAmount,
                payment_method: paymentMethod,
                items: cart.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                })),
            }

            await addOrder(orderData)

            toast.success('Pembayaran berhasil! ✅', {
                duration: 2500,
                style: { background: '#10b981', color: '#fff', fontWeight: 'bold', fontSize: '15px' },
            })

            // Reset for next transaction
            setCart([])
            setCustomerName('')
            setOrderNote('')
            setSearch('')
            setPaymentMethod('')
            setCashPaidAmount('')
            setChangeAmount(0)
            setIsQrisGenerated(false)
            setIsPaid(false)
            setIsPaymentValid(false)

            // Refocus search
            setTimeout(() => searchRef.current?.focus(), 100)
        } catch (err) {
            console.error('Payment error:', err)
            toast.error('Gagal memproses pembayaran')
        } finally {
            setIsProcessing(false)
        }
    }

    // Determine if the pay button should be disabled
    const isPayButtonDisabled = () => {
        if (cart.length === 0 || isProcessing || !paymentMethod) return true
        if (paymentMethod === 'cash') return !isPaymentValid
        if (paymentMethod === 'qris' && isQrisGenerated) return false // allow confirm click
        return false
    }

    // Get pay button label
    const getPayButtonLabel = () => {
        if (isProcessing) return null // handled separately
        if (paymentMethod === 'qris' && isQrisGenerated) return 'Konfirmasi Pembayaran'
        if (paymentMethod === 'qris') return `Bayar ${formatRupiah(totalAmount)}`
        if (cart.length > 0) return `Bayar ${formatRupiah(totalAmount)}`
        return 'Bayar'
    }

    return (
        <POSLayout>
            {/* ═══ LEFT: Product Browsing (65%) ═══ */}
            <section className="w-[65%] flex flex-col p-6 gap-4 overflow-hidden">
                {/* Search Bar */}
                <div className="relative group flex-shrink-0">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#ff8c00] transition-colors">search</span>
                    <input
                        ref={searchRef}
                        type="text"
                        placeholder="Cari menu (contoh: Mangga, Avocado...)"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-white border-none rounded-xl py-4 pl-12 pr-12 text-lg shadow-sm focus:ring-2 focus:ring-[#ff8c00]/50 transition-all outline-none text-slate-900"
                    />
                    {search && (
                        <button
                            onClick={() => { setSearch(''); searchRef.current?.focus() }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                    )}
                </div>

                {/* Categories */}
                <div className="flex gap-3 overflow-x-auto pb-2 flex-shrink-0" style={{ scrollbarWidth: 'none' }}>
                    {filterCategories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`whitespace-nowrap px-6 py-2.5 rounded-full font-semibold transition-all ${activeCategory === cat
                                ? 'bg-[#ff8c00] text-white shadow-md shadow-[#ff8c00]/20 font-bold'
                                : 'bg-white text-slate-600 hover:bg-slate-50 shadow-sm border border-slate-100'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Product Grid — scrollable */}
                <div className="flex-1 min-h-0 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <span className="material-symbols-outlined text-5xl mb-3">search_off</span>
                            <p className="text-base font-medium">Produk tidak ditemukan</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                            {filtered.map(product => {
                                const inCart = cart.find(c => c.id === product.id)
                                const isOutOfStock = !product.stock_status

                                return isOutOfStock ? (
                                    /* Out of Stock Card */
                                    <div
                                        key={product.id}
                                        className="flex flex-col bg-white rounded-xl overflow-hidden shadow-sm opacity-60 relative border border-slate-100 grayscale cursor-not-allowed"
                                    >
                                        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                                            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">HABIS</span>
                                        </div>
                                        {product.image_url ? (
                                            <div
                                                className="aspect-square w-full bg-slate-100 bg-cover bg-center"
                                                style={{ backgroundImage: `url(${product.image_url})` }}
                                            />
                                        ) : (
                                            <div className="aspect-square w-full bg-slate-100 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-slate-300 text-4xl">local_drink</span>
                                            </div>
                                        )}
                                        <div className="p-4 flex flex-col gap-1">
                                            <span className="text-[#ff8c00] text-[10px] font-bold uppercase tracking-widest">{product.category}</span>
                                            <h3 className="font-bold text-slate-900 truncate">{product.name}</h3>
                                            <p className="text-lg font-bold text-slate-900">{formatRupiah(product.price)}</p>
                                        </div>
                                    </div>
                                ) : (
                                    /* Available Product Card */
                                    <button
                                        key={product.id}
                                        onClick={() => addToCart(product)}
                                        className={`flex flex-col bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group text-left border ${inCart ? 'border-[#ff8c00]/40 ring-2 ring-[#ff8c00]/20' : 'border-slate-100'
                                            }`}
                                    >
                                        {product.image_url ? (
                                            <div
                                                className="aspect-square w-full bg-slate-100 bg-cover bg-center"
                                                style={{ backgroundImage: `url(${product.image_url})` }}
                                            />
                                        ) : (
                                            <div className="aspect-square w-full bg-slate-100 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-slate-300 text-4xl group-hover:text-[#ff8c00] transition-colors">local_drink</span>
                                            </div>
                                        )}
                                        <div className="p-4 flex flex-col gap-1 relative">
                                            <span className="text-[#ff8c00] text-[10px] font-bold uppercase tracking-widest">{product.category}</span>
                                            <h3 className="font-bold text-slate-900 truncate">{product.name}</h3>
                                            <p className="text-lg font-bold text-slate-900">{formatRupiah(product.price)}</p>
                                            {inCart && (
                                                <span className="absolute top-2 right-2 size-7 bg-[#ff8c00] text-white rounded-full text-xs font-bold flex items-center justify-center shadow-md">
                                                    {inCart.quantity}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* ═══ RIGHT: Cart & Payment (35%) ═══ */}
            <aside className="w-[35%] bg-white border-l border-slate-200 flex flex-col shadow-2xl">
                {/* Cart Header */}
                <div className="px-6 py-4 flex justify-between items-center border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-900">Pesanan</h2>
                    <div className="flex items-center gap-2">
                        {totalItems > 0 && (
                            <span className="text-xs bg-[#ff8c00]/10 text-[#ff8c00] px-2.5 py-1 rounded-full font-bold">
                                {totalItems} item
                            </span>
                        )}
                        {cart.length > 0 && (
                            <button
                                onClick={clearCart}
                                className="text-xs text-red-400 hover:text-red-600 font-semibold transition-colors"
                            >
                                Hapus Semua
                            </button>
                        )}
                    </div>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3" style={{ scrollbarWidth: 'thin' }}>
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-300">
                            <span className="material-symbols-outlined text-5xl mb-3">shopping_cart</span>
                            <p className="text-sm font-semibold text-slate-400">Belum ada item</p>
                            <p className="text-xs text-slate-400">Tap produk untuk menambahkan</p>
                        </div>
                    ) : (
                        <>
                            {cart.map(item => (
                                <div key={item.id} className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    {/* Thumbnail */}
                                    {item.image_url ? (
                                        <div
                                            className="w-12 h-12 rounded-lg bg-cover bg-center shadow-sm flex-shrink-0"
                                            style={{ backgroundImage: `url(${item.image_url})` }}
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0">
                                            <span className="material-symbols-outlined text-slate-400 text-lg">local_drink</span>
                                        </div>
                                    )}
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-slate-900 truncate">{item.name}</h4>
                                        <p className="text-xs text-slate-500">{formatRupiah(item.price)}</p>
                                    </div>
                                    {/* Quantity Controls */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => updateQuantity(item.id, -1)}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
                                        >
                                            <span className="text-lg font-bold leading-none">−</span>
                                        </button>
                                        <span className="font-bold text-sm w-5 text-center tabular-nums">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.id, 1)}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#ff8c00] text-white font-bold hover:bg-[#e67e00] transition-colors"
                                        >
                                            <span className="text-lg leading-none">+</span>
                                        </button>
                                    </div>
                                    {/* Subtotal + Delete */}
                                    <div className="text-right ml-1 min-w-[65px]">
                                        <p className="text-sm font-bold text-slate-900 tabular-nums">{formatRupiah(item.price * item.quantity)}</p>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-lg">delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Customer Name */}
                            <div className="mt-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Nama Pelanggan</label>
                                <input
                                    type="text"
                                    placeholder="Opsional (Walk-in Customer)"
                                    value={customerName}
                                    onChange={e => setCustomerName(e.target.value)}
                                    className="w-full bg-slate-50 border-none rounded-xl text-sm p-3 focus:ring-1 focus:ring-[#ff8c00]/50 outline-none"
                                />
                            </div>

                            {/* Order Note */}
                            <div className="mt-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Catatan</label>
                                <textarea
                                    value={orderNote}
                                    onChange={e => setOrderNote(e.target.value)}
                                    className="w-full bg-slate-50 border-none rounded-xl text-sm p-3 focus:ring-1 focus:ring-[#ff8c00]/50 h-20 resize-none outline-none"
                                    placeholder="Tambahkan catatan (contoh: Tanpa gula, sedikit es...)"
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Pricing Summary & Payment */}
                <div className="bg-slate-50 p-6 border-t border-slate-200 space-y-4">
                    {/* Price Breakdown */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-slate-600">
                            <span>Subtotal</span>
                            <span className="tabular-nums">{formatRupiah(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-xl font-black text-slate-900 pt-2 border-t border-slate-200">
                            <span>Total</span>
                            <span className="text-[#ff8c00] tabular-nums">{formatRupiah(totalAmount)}</span>
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { value: 'cash', label: 'Tunai', icon: 'payments' },
                            { value: 'qris', label: 'QRIS', icon: 'qr_code_2' },
                        ].map(method => (
                            <button
                                key={method.value}
                                onClick={() => handlePaymentMethodChange(method.value)}
                                className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border-2 font-bold transition-all ${paymentMethod === method.value
                                    ? 'border-[#ff8c00] bg-[#ff8c00]/5 text-[#ff8c00]'
                                    : 'border-slate-200 text-slate-500 hover:border-[#ff8c00]/40'
                                    }`}
                            >
                                <span className="material-symbols-outlined">{method.icon}</span>
                                <span className="text-[10px] uppercase">{method.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* ── Cash Flow: Input & Change Calculation ── */}
                    {paymentMethod === 'cash' && (
                        <div className="space-y-3 animate-fade-in">
                            {/* Uang dibayar input */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Uang Dibayar</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">Rp</span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={cashPaidAmount ? parseInt(cashPaidAmount).toLocaleString('id-ID') : ''}
                                        onChange={handleCashInput}
                                        placeholder="0"
                                        className="w-full bg-white border-2 border-slate-200 rounded-xl text-lg font-bold p-3 pl-12 focus:ring-2 focus:ring-[#ff8c00]/50 focus:border-[#ff8c00] outline-none transition-all tabular-nums"
                                    />
                                </div>
                            </div>

                            {/* Calculation summary */}
                            {cashPaidAmount && (
                                <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Total Belanja</span>
                                        <span className="font-bold text-slate-900 tabular-nums">{formatRupiah(totalAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Uang Dibayar</span>
                                        <span className="font-bold text-slate-900 tabular-nums">{formatRupiah(parseInt(cashPaidAmount) || 0)}</span>
                                    </div>
                                    <div className="border-t border-slate-100 pt-2 flex justify-between">
                                        <span className="font-bold text-slate-700">Kembalian</span>
                                        <span className={`text-lg font-black tabular-nums ${isPaymentValid ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {isPaymentValid ? formatRupiah(changeAmount) : '-'}
                                        </span>
                                    </div>
                                    {/* Validation message */}
                                    {!isPaymentValid && (
                                        <div className="flex items-center gap-2 text-red-500 text-xs font-semibold mt-1">
                                            <span className="material-symbols-outlined text-sm">error</span>
                                            Uang tidak cukup
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── QRIS Flow: Generate & Confirm ── */}
                    {paymentMethod === 'qris' && isQrisGenerated && (
                        <div className="space-y-3 animate-fade-in">
                            <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
                                <p className="text-sm font-bold text-slate-600 mb-3">Scan QRIS untuk membayar</p>
                                <div className="flex justify-center mb-3">
                                    <img
                                        src={qrisImage}
                                        alt="QRIS Kareeem Juice"
                                        className="w-56 h-56 object-contain rounded-lg border border-slate-200 bg-white p-2"
                                    />
                                </div>
                                <div className="bg-[#ff8c00]/5 rounded-lg px-4 py-2.5 inline-flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#ff8c00] text-base">info</span>
                                    <span className="text-xs text-[#ff8c00] font-medium">
                                        Total: <span className="font-extrabold">{formatRupiah(totalAmount)}</span>
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 mt-3">Menunggu konfirmasi pembayaran...</p>
                            </div>
                        </div>
                    )}

                    {/* Pay / Confirm Button */}
                    <button
                        onClick={handlePayment}
                        disabled={isPayButtonDisabled()}
                        className={`w-full py-5 rounded-xl text-lg font-black transition-all active:scale-[0.98] flex items-center justify-center gap-3 ${isPayButtonDisabled()
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            : paymentMethod === 'qris' && isQrisGenerated
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/30'
                                : 'bg-[#ff8c00] hover:bg-[#e67e00] text-white shadow-xl shadow-[#ff8c00]/30'
                            }`}
                    >
                        {isProcessing ? (
                            <>
                                <span className="animate-spin material-symbols-outlined">progress_activity</span>
                                Memproses...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">
                                    {paymentMethod === 'qris' && isQrisGenerated ? 'verified' : 'check_circle'}
                                </span>
                                {getPayButtonLabel()}
                            </>
                        )}
                    </button>
                </div>
            </aside>
        </POSLayout>
    )
}
