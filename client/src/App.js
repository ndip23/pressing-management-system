// client/src/App.js
import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import MainLayout from './components/Layout/MainLayout';
import Spinner from './components/UI/Spinner';
import PublicLayout from './components/Layout/PublicLayout';
import DirectoryLayout from './components/Layout/DirectoryLayout'; // Import the new layout



// Page Imports (Lazy Loaded)
const LoginPage = lazy(() => import('./pages/Auth/LoginPage'));
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage'));
const CreateOrderPage = lazy(() => import('./pages/Orders/CreateOrderPage'));
const OrderDetailsPage = lazy(() => import('./pages/Orders/OrderDetailsPage'));
const EditOrderPage = lazy(() => import('./pages/Orders/EditOrderPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const SettingsPage = lazy(() => import('./pages/Admin/SettingsPage.js'));
const ProfilePage = lazy(() => import('./pages/User/ProfilePage'));
const ManageUsersPage = lazy(() => import('./pages/Admin/ManageUsersPage.js'));

const LandingPage = lazy(() => import('./pages/Public/LandingPage'));
const FeaturesPage = lazy(() => import('./pages/Public/FeaturesPage'));
const PricingPage = lazy(() => import('./pages/Public/PricingPage'));
const SignUpPage = lazy(() => import('./pages/Public/SignUpPage'));
const DirectoryPage = lazy(() => import('./pages/Public/DirectoryPage'));
const BusinessProfilePage = lazy(() => import('./pages/Public/BusinessProfilePage'));


const CustomerListPage = lazy(() => import('./pages/Customers/CustomerListPage'));
const CustomerFormPage = lazy(() => import('./pages/Customers/CustomerFormPage'));
const CustomerDetailsPage = lazy(() => import('./pages/Customers/CustomerDetailsPage'));
const DailyPaymentsPage = lazy(() => import('./pages/Reports/DailyPaymentsPage'));
const PricingSettingsPage = lazy(() => import('./pages/Admin/PricingPage.js'));
const InboxPage = lazy(() => import('./pages/Messaging/InboxPage'));
// Route Protection Components
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return <div className="flex h-screen items-center justify-center"><Spinner size="lg"/></div>;
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
    const { user, isAuthenticated, loading } = useAuth();
    if (loading) return <div className="flex h-screen items-center justify-center"><Spinner size="lg"/></div>;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return user?.role === 'admin' ? children : <Navigate to="/" replace />;
};

function App() {
    return (
        <Router>
            <Suspense fallback={<div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>}>
                <Routes>
                    {/* --- Public Routes --- */}
                    <Route element={<PublicLayout />}>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/features" element={<FeaturesPage />} />
                        <Route path="/pricing" element={<PricingPage />} />
                    </Route>
                        <Route path="/signup" element={<SignUpPage />} />
                        <Route path="/directory" element={<DirectoryLayout />}>
                        <Route index element={<DirectoryPage />} />
                        <Route path="business/:slug" element={<BusinessProfilePage />} />
                    </Route>

                    {/* Standalone Login Page */}
                    <Route path="/login" element={<LoginPage />} />

                    {/* --- Protected Application Routes --- */}
                     <Route path="/app" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                        <Route index element={<Navigate to="dashboard" replace />} />
                        <Route path="dashboard" element={<DashboardPage />} />
                        <Route path="orders/new" element={<CreateOrderPage />} />
                        <Route path="orders/:id" element={<OrderDetailsPage />} />
                        <Route path="orders/:id/edit" element={<EditOrderPage />} />
                        <Route path="payments" element={<DailyPaymentsPage />} />
                        <Route path="inbox" element={<InboxPage />} />
                        
                        {/* Customer Routes */}
                        <Route path="customers" element={<CustomerListPage />} />
                        <Route path="customers/new" element={<CustomerFormPage mode="create" />} />
                        <Route path="customers/:id/edit" element={<CustomerFormPage mode="edit" />} />
                        <Route path="customers/:id/details" element={<CustomerDetailsPage />} />
                        
                        <Route path="profile" element={<ProfilePage />} />

                        {/* Admin Routes (nested under /app/admin) */}
                        <Route path="admin">
                            <Route path="settings" element={
                                <AdminRoute>
                                    <SettingsPage />
                                </AdminRoute>
                            }/>
                            <Route path="users" element={
                                <AdminRoute>
                                    <ManageUsersPage />
                                </AdminRoute>
                            }/>
                             <Route path="pricing" element={
                                <AdminRoute>
                                <PricingSettingsPage />
                             </AdminRoute>
                            } />
                        </Route>
                    </Route>

                    {/* Catch-all Not Found */}
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Suspense>
        </Router>
    );
}

export default App;