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
import ErrorBoundary from './components/ErrorBoundary'
import { useAuth } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import CustomerOrdersPage from './pages/CustomerOrdersPage'
import ProfilePage from './pages/ProfilePage'
import MenuPage from './pages/MenuPage'

// Lazy load admin & POS pages for code splitting
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const MenuManagement = lazy(() => import('./pages/MenuManagement'))
const OrdersPage = lazy(() => import('./pages/OrdersPage'))
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'))
const HistoryPage = lazy(() => import('./pages/HistoryPage'))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'))
const InventoryPage = lazy(() => import('./pages/InventoryPage'))
const POSPage = lazy(() => import('./pages/POSPage'))

const AdminLoadingFallback = () => (
    <div className="min-h-screen flex items-center justify-center bg-[#fcfaf8]">
        <div className="flex flex-col items-center gap-3">
            <span className="animate-spin material-symbols-outlined text-[#ff8c00] text-4xl">progress_activity</span>
            <p className="text-slate-400 text-sm font-medium">Memuat halaman...</p>
        </div>
    </div>
)

function AppContent() {
    const location = useLocation()
    const isAdmin = location.pathname.startsWith('/admin')
    const isPOS = location.pathname.startsWith('/pos')
    const isLoginPage = location.pathname === '/auth'

    const { isRecovering } = useAuth()

    // Global interception for password recovery
    // If Supabase detects a recovery link but redirects to a different page (e.g., '/'),
    // we force the user back to the AuthPage.
    if (isRecovering && !isLoginPage) {
        return <Navigate to="/auth" replace />
    }

    return (
        <div className="relative flex flex-col min-h-screen bg-[#fcfaf8]">
            {/* Don't show navbar on login page or POS mode */}
            {!isLoginPage && !isPOS && <Navbar />}
            <div className="flex-1">
                <Suspense fallback={<AdminLoadingFallback />}>
                    <Routes>
                        {/* Customer */}
                        <Route path="/" element={<MenuPage />} />
                        <Route path="/auth" element={<AuthPage />} />
                        <Route path="/orders" element={<CustomerOrdersPage />} />
                        <Route path="/profile" element={<ProfilePage />} />

                        {/* Admin (all protected) */}
                        <Route path="/admin/analytics" element={
                            <ProtectedRoute><AnalyticsPage /></ProtectedRoute>
                        } />
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
                                <POSPage />
                            </ProtectedRoute>
                        } />

                        {/* Catch all */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Suspense>
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
            <ErrorBoundary>
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
            </ErrorBoundary>
        </BrowserRouter>
    )
}

