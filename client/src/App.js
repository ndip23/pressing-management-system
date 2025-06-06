// client/src/App.js
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import MainLayout from './components/Layout/MainLayout';
import Spinner from './components/UI/Spinner';

const LoginPage = lazy(() => import('./pages/Auth/LoginPage'));
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage'));
const CreateOrderPage = lazy(() => import('./pages/Orders/CreateOrderPage'));
const OrderDetailsPage = lazy(() => import('./pages/Orders/OrderDetailsPage'));
const EditOrderPage = lazy(() => import('./pages/Orders/EditOrderPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const SettingsPage = lazy(() => import('./pages/Admin/SettingsPage.js')); // <--- ADDED IMPORT

const CustomerListPage = lazy(() => import('./pages/Customers/CustomerListPage'));
const CustomerFormPage = lazy(() => import('./pages/Customers/CustomerFormPage'));
const CustomerDetailsPage = lazy(() => import('./pages/Customers/CustomerDetailsPage'));
const DailyPaymentsPage = lazy(() => import('./pages/Reports/DailyPaymentsPage'));

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return <div className="flex h-screen items-center justify-center"><Spinner size="lg"/></div>;
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
    const { user, isAuthenticated, loading } = useAuth();
    if (loading) return <div className="flex h-screen items-center justify-center"><Spinner size="lg"/></div>;
    // It's important that `user` is populated by AuthContext before this check
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return user?.role === 'admin' ? children : <Navigate to="/" replace />; // Redirect non-admins
};

function App() {
    return (
        <Router>
            <Suspense fallback={<div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>}>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <MainLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<DashboardPage />} />
                        <Route path="orders/new" element={<CreateOrderPage />} />
                        <Route path="orders/:id" element={<OrderDetailsPage />} />
                        <Route path="orders/:id/edit" element={<EditOrderPage />} />
                        <Route path="reports/daily-payments" element={<DailyPaymentsPage />} />
                        {/* Customer Routes */}
                        <Route path="customers" element={<CustomerListPage />} />
                        <Route path="customers/new" element={<CustomerFormPage mode="create" />} />
                        <Route path="customers/:id/edit" element={<CustomerFormPage mode="edit" />} />
                        <Route path="customers/:id/details" element={<CustomerDetailsPage />} />
                        {/* Admin Routes */}
                        <Route
                            path="admin/settings" // <--- ADDED ROUTE
                            element={
                                <AdminRoute>
                                    <SettingsPage />
                                </AdminRoute>
                            }
                        />
                        {/* Example of another admin route */}
                        {/* <Route path="admin/users" element={<AdminRoute><ManageUsersPage /></AdminRoute>} /> */}
                    </Route>
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Suspense>
        </Router>
    );
}

export default App;