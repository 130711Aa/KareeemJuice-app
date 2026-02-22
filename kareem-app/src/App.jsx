import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { lazy, Suspense } from 'react'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import { OrdersProvider } from './context/OrdersContext'
import { CategoriesProvider } from './context/CategoriesContext'
import { ProductsProvider } from './context/ProductsContext'
import { StoreStatusProvider } from './context/StoreStatusContext'
import Navbar from './components/Navbar'
import CartDrawer from './components/CartDrawer'
import ProtectedRoute from './components/ProtectedRoute'
import AuthPage from './pages/AuthPage'
import CustomerOrdersPage from './pages/CustomerOrdersPage'
import ProfilePage from './pages/ProfilePage'
import MenuPage from './pages/MenuPage'
import AdminDashboard from './pages/AdminDashboard'
import MenuManagement from './pages/MenuManagement'

import OrdersPage from './pages/OrdersPage'
import CategoriesPage from './pages/CategoriesPage'
import HistoryPage from './pages/HistoryPage'
import AnalyticsPage from './pages/AnalyticsPage'
import InventoryPage from './pages/InventoryPage'

// Lazy load POS page for code splitting
const POSPage = lazy(() => import('./pages/POSPage'))

function AppContent() {
    const location = useLocation()
    const isAdmin = location.pathname.startsWith('/admin')
    const isPOS = location.pathname.startsWith('/pos')
    const isLoginPage = location.pathname === '/auth'

    return (
        <div className="relative flex flex-col min-h-screen bg-[#fcfaf8]">
            {/* Don't show navbar on login page or POS mode */}
            {!isLoginPage && !isPOS && <Navbar />}
            <div className="flex-1">
                <Routes>
                    {/* Customer */}
                    <Route path="/" element={<MenuPage />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/orders" element={<CustomerOrdersPage />} />
                    <Route path="/profile" element={<ProfilePage />} />

                    {/* Admin Login (public) - now consolidated to /auth */}
                    <Route path="/admin/analytics" element={<AnalyticsPage />} />

                    {/* Admin (protected) */}
                    <Route path="/admin" element={
                        <ProtectedRoute><AdminDashboard /></ProtectedRoute>
                    } />
                    <Route path="/admin/orders" element={
                        <ProtectedRoute><OrdersPage /></ProtectedRoute>
                    } />
                    <Route path="/admin/menu" element={
                        <ProtectedRoute><MenuManagement /></ProtectedRoute>
                    } />
                    <Route path="/admin/history" element={
                        <ProtectedRoute><HistoryPage /></ProtectedRoute>
                    } />
                    <Route path="/admin/categories" element={
                        <ProtectedRoute><CategoriesPage /></ProtectedRoute>
                    } />
                    <Route path="/admin/inventory" element={
                        <ProtectedRoute><InventoryPage /></ProtectedRoute>
                    } />
                    {/* Redirect legacy admin login */}
                    <Route path="/admin/login" element={<Navigate to="/auth" replace />} />

                    {/* POS Cashier Mode (protected, lazy-loaded) */}
                    <Route path="/pos" element={
                        <ProtectedRoute>
                            <Suspense fallback={
                                <div className="fixed inset-0 bg-[#0f0f1a] flex items-center justify-center z-50">
                                    <div className="flex flex-col items-center gap-3">
                                        <span className="animate-spin material-symbols-outlined text-[#ff8c00] text-4xl">progress_activity</span>
                                        <p className="text-white/50 text-sm font-medium">Memuat Mode Kasir...</p>
                                    </div>
                                </div>
                            }>
                                <POSPage />
                            </Suspense>
                        </ProtectedRoute>
                    } />

                    {/* Catch all */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
            {/* Cart drawer only for customer pages (hide on admin & POS) */}
            {!isAdmin && !isPOS && <CartDrawer />}
            <Toaster position="top-center" toastOptions={{ style: { pointerEvents: 'auto' }, duration: 2500 }} />
        </div>
    )
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <OrdersProvider>
                    <ProductsProvider>
                        <CategoriesProvider>
                            <CartProvider>
                                <StoreStatusProvider>
                                    <AppContent />
                                </StoreStatusProvider>
                            </CartProvider>
                        </CategoriesProvider>
                    </ProductsProvider>
                </OrdersProvider>
            </AuthProvider>
        </BrowserRouter>
    )
}
