// client/src/App.js
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext'; // Assuming AuthProvider is in index.js
import { AdminNotificationProvider } from './contexts/NotificationContext';

import MainLayout from './components/Layout/MainLayout';
import Spinner from './components/UI/Spinner';

const LoginPage = lazy(() => import('./pages/Auth/LoginPage'));
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage'));
const CreateOrderPage = lazy(() => import('./pages/Orders/CreateOrderPage'));
const OrderDetailsPage = lazy(() => import('./pages/Orders/OrderDetailsPage'));
const EditOrderPage = lazy(() => import('./pages/Orders/EditOrderPage'));
const SettingsPage = lazy(() => import('./pages/Admin/SettingsPage.js'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const CustomerListPage = lazy(() => import('./pages/Customers/CustomerListPage'));
const CustomerFormPage = lazy(() => import('./pages/Customers/CustomerFormPage'));
const CustomerDetailsPage = lazy(() => import('./pages/Customers/CustomerDetailsPage'));

const ProtectedRoute = ({ children }) => { /* ... as before ... */ };
const AdminRoute = ({ children }) => { /* ... as before ... */ };

function App() {
    return (
        // Assuming AuthProvider and AdminNotificationProvider wrap App in index.js
        <Router>
            <Suspense fallback={<div className="flex h-screen items-center justify-center bg-apple-gray-100 dark:bg-apple-gray-950"><Spinner size="lg" /></div>}>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                        <Route index element={<DashboardPage />} />
                        <Route path="orders/new" element={<CreateOrderPage />} />
                        <Route path="orders/:id" element={<OrderDetailsPage />} />
                        <Route path="orders/:id/edit" element={<EditOrderPage />} />

                        {/* CUSTOMER ROUTES - now at top level */}
                        <Route path="customers" element={<CustomerListPage />} />
                        <Route path="customers/new" element={<CustomerFormPage mode="create" />} />
                        <Route path="customers/:id/edit" element={<CustomerFormPage mode="edit" />} />
                        <Route path="customers/:id/details" element={<CustomerDetailsPage />} />

                        {/* ADMIN SPECIFIC ROUTES */}
                        <Route path="admin/settings" element={<AdminRoute><SettingsPage /></AdminRoute>} />
                        {/* If you had a separate payments page: <Route path="payments" element={<PaymentsPage />} /> */}
                    </Route>
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Suspense>
        </Router>
    );
}

export default App;