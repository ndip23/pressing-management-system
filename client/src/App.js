// client/src/App.js
import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Outlet } from 'react-router-dom';

// --- LAYOUTS ---
import MainLayout from './components/Layout/MainLayout';
import PublicLayout from './pages/Public/PublicLayout'; // Changed path assuming it's a page-level layout
import DirectoryLayout from './pages/Public/DirectoryLayout'; // Changed path assuming it's a page-level layout
import Spinner from './components/UI/Spinner';
import DirectoryAdminRoute from './components/Auth/DirectoryAdminRoute'; 

// --- AUTH & STANDALONE PAGES ---
const LoginPage = lazy(() => import('./pages/Auth/LoginPage'));
const SignUpPage = lazy(() => import('./pages/Public/SignUpPage'));
const DirectoryAdminLoginPage = lazy(() => import('./pages/Admin/DirectoryAdminLoginPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// --- PUBLIC PAGES ---
const LandingPage = lazy(() => import('./pages/Public/LandingPage'));
const FeaturesPage = lazy(() => import('./pages/Public/FeaturesPage'));
const PricingPage = lazy(() => import('./pages/Public/PricingPage'));
const DirectoryPage = lazy(() => import('./pages/Public/DirectoryPage'));
const BusinessProfilePage = lazy(() => import('./pages/Public/BusinessProfilePage'));

// --- PROTECTED APP PAGES ---
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

// --- PROTECTED ADMIN PAGES ---
const SettingsPage = lazy(() => import('./pages/Admin/SettingsPage.js'));
const ManageUsersPage = lazy(() => import('./pages/Admin/ManageUsersPage.js'));
const PricingSettingsPage = lazy(() => import('./pages/Admin/PricingPage.js'));
const ManageDirectoryPage = lazy(() => import('./pages/Admin/ManageDirectoryPage.js'));
const DirectoryAdminDashboard = lazy(() => import('./pages/Admin/DirectoryAdminDashboard'));


// --- ROUTE PROTECTION ---
// Assuming this path

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return <div className="flex h-screen items-center justify-center"><Spinner size="lg"/></div>;
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
    const { user, isAuthenticated, loading } = useAuth();
    if (loading) return <div className="flex h-screen items-center justify-center"><Spinner size="lg"/></div>;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return user?.role === 'admin' ? children : <Navigate to="/app/dashboard" replace />; // Redirect to app dashboard
};

function App() {
    return (
        <Router>
            <Suspense fallback={<div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>}>
                <Routes>
                    {/* --- 1. SaaS MARKETING & PUBLIC ROUTES --- */}
                    <Route element={<PublicLayout />}>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/features" element={<FeaturesPage />} />
                        <Route path="/pricing" element={<PricingPage />} />
                    </Route>

                    {/* --- 2. PUBLIC DIRECTORY ROUTES --- */}
                    <Route element={<DirectoryLayout />}>
                        <Route path="/directory" element={<DirectoryPage />} />
                        <Route path="/directory/:slug" element={<BusinessProfilePage />} />
                    </Route>
                    
                    {/* --- 3. STANDALONE PUBLIC ROUTES (No standard layout) --- */}
                    <Route path="/signup" element={<SignUpPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/directory-admin/login" element={<DirectoryAdminLoginPage />} />

                    {/* --- 4. PROTECTED MAIN APPLICATION --- */}
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

                        {/* --- PROTECTED ADMIN SUB-ROUTES --- */}
                        <Route path="admin" element={<AdminRoute><Outlet /></AdminRoute>}> {/* Protects all nested routes */}
                            <Route index element={<Navigate to="settings" replace />} /> {/* Default admin route */}
                            <Route path="settings" element={<SettingsPage />}/>
                            <Route path="users" element={<ManageUsersPage />}/>
                            <Route path="pricing" element={<PricingSettingsPage />}/>
                            <Route path="directory" element={<ManageDirectoryPage />}/>
                        </Route>
                    </Route>

                    {/* --- 5. HIDDEN DIRECTORY ADMIN DASHBOARD --- */}
                    <Route element={<DirectoryAdminRoute />}>
                        <Route path="/directory-admin/dashboard" element={<DirectoryAdminDashboard />} />
                    </Route>

                    {/* --- 6. CATCH-ALL NOT FOUND --- */}
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Suspense>
        </Router>
    );
}

export default App;

