// client/src/App.js
import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { DirectoryAuthProvider } from './contexts/DirectoryAuthContext';

// --- LAYOUTS ---
import MainLayout from './components/Layout/MainLayout';
import PublicLayout from './pages/Public/PublicLayout';
import DirectoryLayout from './pages/Public/DirectoryLayout';
import Spinner from './components/UI/Spinner';

// --- ROUTE PROTECTION ---
import DirectoryAdminRoute from './components/Auth/DirectoryAdminRoute';

// --- LAZY LOADED PAGES ---
const LoginPage = lazy(() => import('./pages/Auth/LoginPage'));
const SignUpPage = lazy(() => import('./pages/Public/SignUpPage'));
const DirectoryAdminLoginPage = lazy(() => import('./pages/Admin/DirectoryAdminLoginPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const LandingPage = lazy(() => import('./pages/Public/LandingPage'));
const FeaturesPage = lazy(() => import('./pages/Public/FeaturesPage'));
const PricingPage = lazy(() => import('./pages/Public/PricingPage'));
const DirectoryPage = lazy(() => import('./pages/Public/DirectoryPage'));
const BusinessProfilePage = lazy(() => import('./pages/Public/BusinessProfilePage'));
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage'));
const CreateOrderPage = lazy(() => import('./pages/Orders/CreateOrderPage'));
const OrderDetailsPage = lazy(() => import('./pages/Orders/OrderDetailsPage'));
const EditOrderPage = lazy(() => import('./pages/Orders/EditOrderPage'));
const CustomerListPage = lazy(() => import('./pages/Customers/CustomerListPage'));
const CustomerFormPage = lazy(() => import('./pages/Customers/CustomerFormPage'));
const CustomerDetailsPage = lazy(() => import('./pages/Customers/CustomerDetailsPage'));
const ProfilePage = lazy(() => import('./pages/User/ProfilePage'));
const DailyPaymentsPage = lazy(() => import('./pages/Reports/DailyPaymentsPage'));
const InboxPage = lazy(() => import('./pages/Messaging/InboxPage'));
const SettingsPage = lazy(() => import('./pages/Admin/SettingsPage.js'));
const ManageUsersPage = lazy(() => import('./pages/Admin/ManageUsersPage.js'));
const PricingSettingsPage = lazy(() => import('./pages/Admin/PricingPage.js'));
const ManageDirectoryPage = lazy(() => import('./pages/Admin/ManageDirectoryPage.js'));
const DirectoryAdminDashboard = lazy(() => import('./pages/Admin/DirectoryAdminDashboard'));


// --- CORRECTED Route Protection Components ---
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading: authLoading } = useAuth();

    // 1. Wait for the initial authentication check from AuthContext to finish
    if (authLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-apple-gray-100 dark:bg-apple-gray-950">
                <Spinner size="lg" />
            </div>
        );
    }

    // 2. After loading is finished, THEN decide to render the protected content or redirect
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    
    // 1. Wait for the initial auth check
    if (authLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-apple-gray-100 dark:bg-apple-gray-950">
                <Spinner size="lg" />
            </div>
        );
    }

    // 2. After loading, first check if authenticated at all
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    // 3. If authenticated, then check the role
    return user?.role === 'admin' ? children : <Navigate to="/app/dashboard" replace />;
};


function App() {
    return (
        <Router>
            <Suspense fallback={<div className="flex h-screen items-center justify-center bg-apple-gray-100 dark:bg-apple-gray-950"><Spinner size="lg" /></div>}>
                <Routes>
                    {/* --- SaaS MARKETING & PUBLIC ROUTES --- */}
                    <Route element={<PublicLayout />}>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/features" element={<FeaturesPage />} />
                        <Route path="/pricing" element={<PricingPage />} />
                    </Route>

                    {/* --- PUBLIC DIRECTORY ROUTES --- */}
                    <Route element={<DirectoryLayout />}>
                        <Route path="/directory" element={<DirectoryPage />} />
                        <Route path="/directory/:slug" element={<BusinessProfilePage />} />
                    </Route>
                    
                    {/* --- STANDALONE PUBLIC ROUTES (No standard layout) --- */}
                    <Route path="/signup" element={<SignUpPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    
                    {/* --- HIDDEN DIRECTORY ADMIN SECTION (Wrapped in its own provider) --- */}
                    <Route path="/directory-admin/*" element={
                        <DirectoryAuthProvider>
                            <Routes>
                                <Route path="login" element={<DirectoryAdminLoginPage />} />
                                <Route element={<DirectoryAdminRoute />}>
                                    <Route path="dashboard" element={<DirectoryAdminDashboard />} />
                                </Route>
                            </Routes>
                        </DirectoryAuthProvider>
                    } />

                    {/* --- PROTECTED MAIN APPLICATION --- */}
                    <Route path="/app" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                        <Route index element={<Navigate to="dashboard" replace />} />
                        <Route path="dashboard" element={<DashboardPage />} />
                        <Route path="orders/new" element={<CreateOrderPage />} />
                        <Route path="orders/:id" element={<OrderDetailsPage />} />
                        <Route path="orders/:id/edit" element={<EditOrderPage />} />
                        <Route path="customers" element={<CustomerListPage />} />
                        <Route path="customers/new" element={<CustomerFormPage mode="create" />} />
                        <Route path="customers/:id/edit" element={<CustomerFormPage mode="edit" />} />
                        <Route path="customers/:id/details" element={<CustomerDetailsPage />} />
                        <Route path="payments" element={<DailyPaymentsPage />} />
                        <Route path="inbox" element={<InboxPage />} />
                        <Route path="profile" element={<ProfilePage />} />

                        <Route path="admin" element={<AdminRoute><Outlet /></AdminRoute>}>
                            <Route index element={<Navigate to="settings" replace />} />
                            <Route path="settings" element={<SettingsPage />}/>
                            <Route path="users" element={<ManageUsersPage />}/>
                            <Route path="pricing" element={<PricingSettingsPage />}/>
                            <Route path="directory" element={<ManageDirectoryPage />}/>
                        </Route>
                    </Route>

                    {/* --- CATCH-ALL NOT FOUND --- */}
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Suspense>
        </Router>
    );
}

export default App;