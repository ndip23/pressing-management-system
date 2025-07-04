// client/src/App.js
import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import MainLayout from './components/Layout/MainLayout';
import Spinner from './components/UI/Spinner';
import PublicLayout from './components/Layout/PublicLayout';

const LoginPage = lazy(() => import('./pages/Auth/LoginPage'));
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage'));
const CreateOrderPage = lazy(() => import('./pages/Orders/CreateOrderPage'));
const OrderDetailsPage = lazy(() => import('./pages/Orders/OrderDetailsPage'));
const EditOrderPage = lazy(() => import('./pages/Orders/EditOrderPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const SettingsPage = lazy(() => import('./pages/Admin/SettingsPage.js')); 
const ProfilePage = lazy(() => import('./pages/User/ProfilePage'));
const ManageUsersPage = lazy(() => import('./pages/Admin/ManageUsersPage.js'));


// Public Page Imports
const LandingPage = lazy(() => import('./pages/Public/LandingPage'));
const FeaturesPage = lazy(() => import('./pages/Public/FeaturesPage'));
const PricingPage = lazy(() => import('./pages/Public/PricingPage'));
const SignUpPage = lazy(() => import('./pages/Public/SignUpPage'));


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
                    <Route element={<PublicLayout />}>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/features" element={<FeaturesPage />} />
                        <Route path="/pricing" element={<PricingPage />} /> 
                        <Route path="/signup" element={<SignUpPage />} /> 
                    </Route>
                    <Route path="/login" element={<LoginPage />} />
                     <Route path="/app" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                     <Route index element={<Navigate to="dashboard" replace />} />
                     <Route path="dashboard" element={<DashboardPage />} />
                        <Route path="/app/orders/new" element={<CreateOrderPage />} />
                        <Route path="/app/orders/:id" element={<OrderDetailsPage />} />
                        <Route path="/app/orders/:id/edit" element={<EditOrderPage />} />
                        <Route path="/app/payments" element={<DailyPaymentsPage />} />
                        {/* Customer Routes */}
                        <Route path="/app/customers" element={<CustomerListPage />} />
                        <Route path="/app/customers/new" element={<CustomerFormPage mode="create" />} />
                        <Route path="/app/customers/:id/edit" element={<CustomerFormPage mode="edit" />} />
                        <Route path="/app/customers/:id/details" element={<CustomerDetailsPage />} />
                        <Route path="/app/profile" element={<ProfilePage />} /> 
                        {/* Admin Routes */}
                        <Route
                            path="/app/admin/settings" 
                            element={
                                <AdminRoute>
                                    <SettingsPage />
                                </AdminRoute>
                            }
                        />
                         <Route path="/app/admin/users" element={<AdminRoute><ManageUsersPage /></AdminRoute>} /> 
                    </Route>
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Suspense>
        </Router>
    );
}

export default App;