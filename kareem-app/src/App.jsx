import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import { OrdersProvider } from './context/OrdersContext'
import { CategoriesProvider } from './context/CategoriesContext'
import { ProductsProvider } from './context/ProductsContext'
import Navbar from './components/Navbar'
import CartDrawer from './components/CartDrawer'
import ProtectedRoute from './components/ProtectedRoute'
import MenuPage from './pages/MenuPage'
import AdminDashboard from './pages/AdminDashboard'
import MenuManagement from './pages/MenuManagement'
import AdminLogin from './pages/AdminLogin'
import OrdersPage from './pages/OrdersPage'
import CategoriesPage from './pages/CategoriesPage'
import HistoryPage from './pages/HistoryPage'
import AnalyticsPage from './pages/AnalyticsPage'
import InventoryPage from './pages/InventoryPage'

function AppContent() {
    const location = useLocation()
    const isAdmin = location.pathname.startsWith('/admin')
    const isLoginPage = location.pathname === '/admin/login'

    return (
        <div className="relative flex flex-col min-h-screen bg-[#fcfaf8]">
            {/* Don't show navbar on login page */}
            {!isLoginPage && <Navbar />}
            <div className="flex-1">
                <Routes>
                    {/* Customer */}
                    <Route path="/" element={<MenuPage />} />

                    {/* Admin Login (public) */}
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin/analytics" element={
                        <OrdersProvider>
                            <AnalyticsPage />
                        </OrdersProvider>
                    } />

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
                </Routes>
            </div>
            {/* Cart drawer only for customer pages */}
            {!isAdmin && <CartDrawer />}
            <Toaster position="bottom-center" />
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
                                <AppContent />
                            </CartProvider>
                        </CategoriesProvider>
                    </ProductsProvider>
                </OrdersProvider>
            </AuthProvider>
        </BrowserRouter>
    )
}
