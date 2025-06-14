// client/src/App.js
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext'; // AuthProvider is in index.js

import MainLayout from './components/Layout/MainLayout';
import Spinner from './components/UI/Spinner'; // Your global spinner component

// --- Page Imports (Lazy Loaded) ---
const LoginPage = lazy(() => import('./pages/Auth/LoginPage'));
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage'));

const CreateOrderPage = lazy(() => import('./pages/Orders/CreateOrderPage'));
const OrderDetailsPage = lazy(() => import('./pages/Orders/OrderDetailsPage'));
const EditOrderPage = lazy(() => import('./pages/Orders/EditOrderPage'));

const CustomerListPage = lazy(() => import('./pages/Customers/CustomerListPage'));
const CustomerFormPage = lazy(() => import('./pages/Customers/CustomerFormPage'));
const CustomerDetailsPage = lazy(() => import('./pages/Customers/CustomerDetailsPage'));

const ProfilePage = lazy(() => import('./pages/User/ProfilePage.js'));

const SettingsPage = lazy(() => import('./pages/Admin/SettingsPage.js'));
// const ManageUsersPlaceholderPage = lazy(() => import('./pages/Admin/ManageUsersPlaceholderPage')); // If you use this

const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// --- Route Protection Components ---
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading: authLoading } = useAuth(); // Renamed loading to authLoading for clarity
    if (authLoading) {
        // This covers the very initial app load state from AuthContext
        return <div className="flex h-screen items-center justify-center bg-apple-gray-100 dark:bg-apple-gray-950"><Spinner size="lg" /></div>;
    }
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    if (authLoading) {
        return <div className="flex h-screen items-center justify-center bg-apple-gray-100 dark:bg-apple-gray-950"><Spinner size="lg" /></div>;
    }
    if (!isAuthenticated) { // User must be authenticated first
        return <Navigate to="/login" replace />;
    }
    return user?.role === 'admin' ? children : <Navigate to="/" replace />; // Then check role
};


function App() {
    return (
        // AuthProvider and AdminNotificationProvider are in client/src/index.js wrapping this App component
        <Router>
            <Suspense fallback={
                <div className="flex h-screen items-center justify-center bg-apple-gray-100 dark:bg-apple-gray-950">
                    <Spinner size="lg" />
                </div>
            }>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />

                    {/* Routes requiring authentication and using MainLayout */}
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <MainLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<DashboardPage />} /> {/* Default page after login */}

                        {/* Order Management Routes */}
                        <Route path="orders/new" element={<CreateOrderPage />} />
                        <Route path="orders/:id" element={<OrderDetailsPage />} />
                        <Route path="orders/:id/edit" element={<EditOrderPage />} />

                        {/* Customer Management Routes */}
                        <Route path="customers" element={<CustomerListPage />} />
                        <Route path="customers/new" element={<CustomerFormPage mode="create" />} />
                        <Route path="customers/:id/edit" element={<CustomerFormPage mode="edit" />} />
                        <Route path="customers/:id/details" element={<CustomerDetailsPage />} />

                        {/* User Profile Route */}
                        <Route path="profile" element={<ProfilePage />} />

                        {/* Admin-Specific Routes */}
                        <Route path="admin/settings" element={
                            <AdminRoute>
                                <SettingsPage />
                            </AdminRoute>
                        } />
                        {/* Example for future Admin User Management UI */}
                        {/*
                        <Route path="admin/manage-users" element={
                            <AdminRoute>
                                <ManageUsersPage />
                            </AdminRoute>
                        } />
                        */}
                        {/* If you used the placeholder page for Manage Users: */}
                        {/*
                        <Route path="admin/users" element={
                            <AdminRoute>
                                <ManageUsersPlaceholderPage />
                            </AdminRoute>
                        } />
                        */}

                        {/* Placeholder for Payments Page (if you add it) */}
                        {/* <Route path="payments" element={<PaymentsPage />} /> */}

                    </Route> {/* End of MainLayout protected routes */}

                    {/* Catch-all for Not Found */}
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Suspense>
        </Router>
    );
}

export default App;