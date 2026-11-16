import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Common components
import DemoAccountBar from './components/common/DemoAccountBar';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';

// Public & Customer pages
import HomePage from './pages/public/HomePage';
import MenuPage from './pages/public/MenuPage';
import TableOrderPage from './pages/customer/TableOrderPage';
import TableQrOrderPage from './pages/customer/TableQrOrderPage';
import OrderTrackingPage from './pages/customer/OrderTrackingPage';
import CustomerOrderHistoryPage from './pages/customer/CustomerOrderHistoryPage';

// Chef & Cashier pages
import WaiterServicePage from './pages/waiter/WaiterServicePage';
import ChefKitchenPage from './pages/chef/ChefKitchenPage';
import CashierPosPage from './pages/cashier/CashierPosPage';

// Manager pages
import ManagerLayout from './pages/manager/ManagerLayout';
import ManagerDashboardPage from './pages/manager/ManagerDashboardPage';
import ManagerMenuPage from './pages/manager/ManagerMenuPage';
import ManagerTablesPage from './pages/manager/ManagerTablesPage';
import ManagerOrdersPage from './pages/manager/ManagerOrdersPage';
import ManagerReportsPage from './pages/manager/ManagerReportsPage';
import ManagerStaffPage from './pages/manager/ManagerStaffPage';
import ManagerAuditPage from './pages/manager/ManagerAuditPage';
import ManagerSettingsPage from './pages/manager/ManagerSettingsPage';
import ManagerIngredientsPage from './pages/manager/ManagerIngredientsPage';
import ManagerSuppliersPage from './pages/manager/ManagerSuppliersPage';
import ManagerStockReceiptsPage from './pages/manager/ManagerStockReceiptsPage';
import ManagerRecipesPage from './pages/manager/ManagerRecipesPage';
import ManagerPromotionsPage from './pages/manager/ManagerPromotionsPage';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-[#FAF9F5] text-stone-800">
            {/* Top quick switcher for test accounts */}
            <DemoAccountBar />

            <Routes>
              {/* Manager routes have their own layout without default Navbar/Footer */}
              <Route
                path="/manager"
                element={
                  <ProtectedRoute allowedRoles={['MANAGER']}>
                    <ManagerLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<ManagerDashboardPage />} />
                <Route path="menu" element={<ManagerMenuPage />} />
                <Route path="tables" element={<ManagerTablesPage />} />
                <Route path="orders" element={<ManagerOrdersPage />} />
                <Route path="inventory/ingredients" element={<ManagerIngredientsPage />} />
                <Route path="inventory/suppliers" element={<ManagerSuppliersPage />} />
                <Route path="inventory/receipts" element={<ManagerStockReceiptsPage />} />
                <Route path="inventory/recipes" element={<ManagerRecipesPage />} />
                <Route path="promotions" element={<ManagerPromotionsPage />} />
                <Route path="reports" element={<ManagerReportsPage />} />
                <Route path="staff" element={<ManagerStaffPage />} />
                <Route path="audit" element={<ManagerAuditPage />} />
                <Route path="settings" element={<ManagerSettingsPage />} />
              </Route>

              {/* All other routes share Navbar & Footer */}
              <Route
                path="*"
                element={
                  <div className="flex flex-col min-h-screen">
                    <Navbar />
                    <div className="flex-1">
                      <Routes>
                        {/* Public */}
                        <Route path="/" element={<HomePage />} />
                        <Route path="/menu" element={<MenuPage />} />
                        <Route path="/order" element={<TableOrderPage />} />
                        <Route path="/table/:tableCode" element={<TableQrOrderPage />} />
                        <Route path="/qr/:token" element={<TableQrOrderPage />} />
                        <Route path="/orders/:id/track" element={<OrderTrackingPage />} />

                        {/* Customer */}
                        <Route
                          path="/customer/orders"
                          element={
                            <ProtectedRoute allowedRoles={['CUSTOMER', 'MANAGER']}>
                              <CustomerOrderHistoryPage />
                            </ProtectedRoute>
                          }
                        />

                        {/* Waiter */}
                        <Route
                          path="/waiter"
                          element={
                            <ProtectedRoute allowedRoles={['WAITER', 'MANAGER']}>
                              <WaiterServicePage />
                            </ProtectedRoute>
                          }
                        />

                        {/* Chef */}
                        <Route
                          path="/chef"
                          element={
                            <ProtectedRoute allowedRoles={['CHEF', 'MANAGER']}>
                              <ChefKitchenPage />
                            </ProtectedRoute>
                          }
                        />

                        {/* Cashier */}
                        <Route
                          path="/cashier"
                          element={
                            <ProtectedRoute allowedRoles={['CASHIER', 'MANAGER']}>
                              <CashierPosPage />
                            </ProtectedRoute>
                          }
                        />

                        {/* Auth */}
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />

                        {/* 404 Fallback */}
                        <Route
                          path="*"
                          element={
                            <div className="py-24 text-center space-y-4">
                              <h2 className="font-serif text-3xl font-bold text-stone-900">404 - Không Tìm Thấy Trang</h2>
                              <p className="text-xs text-stone-500">Đường dẫn bạn yêu cầu không tồn tại hoặc đã thay đổi.</p>
                              <a href="/" className="inline-block px-4 py-2 bg-[#234232] text-white text-xs font-semibold rounded-xl">
                                Quay Về Trang Chủ
                              </a>
                            </div>
                          }
                        />
                      </Routes>
                    </div>
                    <Footer />
                  </div>
                }
              />
            </Routes>
          </div>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
