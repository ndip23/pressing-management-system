// client/src/App.js
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'; 
import { useAuth } from './contexts/AuthContext';
import { DirectoryAuthProvider } from './contexts/DirectoryAuthContext';
import MainLayout from './components/Layout/MainLayout';
import PublicLayout from './pages/Public/PublicLayout';
import DirectoryLayout from './pages/Public/DirectoryLayout';
import Spinner from './components/UI/Spinner';
import DirectoryAdminRoute from './components/Auth/DirectoryAdminRoute';
import OnboardingRedirect from './components/Auth/OnboardingRedirect';
import WalletGate from './components/Auth/WalletGate';

// --- LAZY-LOADED PAGE COMPONENTS ---
const LoginPage = lazy(() => import('./pages/Auth/LoginPage'));
const SignUpPage = lazy(() => import('./pages/Public/SignUpPage'));
const DirectoryAdminLoginPage = lazy(() => import('./pages/Admin/DirectoryAdminLoginPage'));
const LandingPage = lazy(() => import('./pages/Public/LandingPage'));
const FeaturesPage = lazy(() => import('./pages/Public/FeaturesPage'));
const PricingPage = lazy(() => import('./pages/Public/PricingPage'));
const DirectoryPage = lazy(() => import('./pages/Public/DirectoryPage'));
const BusinessProfilePage = lazy(() => import('./pages/Public/BusinessProfilePage'));
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage'));
const OrdersListPage = lazy(() => import('./pages/Orders/OrdersListPage'));
const CreateOrderPage = lazy(() => import('./pages/Orders/CreateOrderPage'));
const OrderDetailsPage = lazy(() => import('./pages/Orders/OrderDetailsPage'));
const EditOrderPage = lazy(() => import('./pages/Orders/EditOrderPage'));
const CustomerListPage = lazy(() => import('./pages/Customers/CustomerListPage'));
const CustomerFormPage = lazy(() => import('./pages/Customers/CustomerFormPage'));
const CustomerDetailsPage = lazy(() => import('./pages/Customers/CustomerDetailsPage'));
const ProfilePage = lazy(() => import('./pages/User/ProfilePage'));
const BusinessProfileSetupPage = lazy(() => import('./pages/User/BusinessProfileSetupPage'));
const WalletTopUpPage = lazy(() => import('./pages/User/WalletTopUpPage'));
const WalletPaymentCountryPage = lazy(() => import('./pages/User/WalletPaymentCountryPage'));
const WalletOnboardingPromptPage = lazy(() => import('./pages/User/WalletOnboardingPromptPage'));
const AppSubscriptionPage = lazy(() => import('./pages/User/AppSubscriptionPage'));
const SubscriptionRequiredPage = lazy(() => import('./pages/User/SubscriptionRequiredPage'));
const DailyPaymentsPage = lazy(() => import('./pages/Reports/DailyPaymentsPage'));
const InboxPage = lazy(() => import('./pages/Messaging/InboxPage'));
const SettingsPage = lazy(() => import('./pages/Admin/SettingsPage.js'));
const ManageUsersPage = lazy(() => import('./pages/Admin/ManageUsersPage.js'));
const ManageDirectoryPage = lazy(() => import('./pages/Admin/ManageDirectoryPage.js'));
const AdminPricingPage = lazy(() => import('./pages/Admin/PricingPage'));
const DirectoryAdminDashboard = lazy(() => import('./pages/Admin/DirectoryAdminDashboard'));
const VerifyPaymentPage = lazy(() => import('./pages/Public/VerifyPaymentPage'));
const VerifyUpgradePage = lazy(() => import('./pages/Public/VerifyUpgradePage'));
const ContactPage = lazy(() => import('./pages/Public/ContactPage')); 
const PaymentPage = lazy(() => import('./pages/Public/PaymentPage'));
const TermsPage = lazy(() => import('./pages/Public/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/Public/PrivacyPage'));
const ManageSystemPage = lazy(() => import('./pages/Dashboard/ManageSystemPage'));


const ProtectedRoute = ({ children, allowInactive = false }) => {
    const { isAuthenticated, loading, user } = useAuth();
    if (loading) return <div className="flex h-screen items-center justify-center"><Spinner size="lg"/></div>;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (!allowInactive) {
        const tenant = user?.tenant;
        const allowedStatuses = ['active', 'trial', 'trialing'];
        const hasValidSubscription = tenant && allowedStatuses.includes(tenant.subscriptionStatus);
        const hasValidTenant = tenant?.isActive !== false;
        if (!hasValidSubscription || !hasValidTenant) {
            return <SubscriptionRequiredPage />;
        }
    }
    return children ?? <Outlet />;
};


const AdminRoute = ({ children }) => {
    const { user, isAuthenticated, loading } = useAuth();
    if (loading) return <div className="flex h-screen items-center justify-center"><Spinner size="lg"/></div>;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (user?.role !== 'admin' && user?.role !== 'superadmin') {
        return <Navigate to="/app/dashboard" replace />;
    }
    return children ?? <Outlet />;
};

function App() {
    return (
        <DirectoryAuthProvider>
            <Suspense fallback={<div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>}>
                <Routes>
                    <Route element={<DirectoryLayout />}>
                        <Route path="/" element={<DirectoryPage />} />
                        <Route path="/directory" element={<DirectoryPage />} />
                        <Route path="/directory/:slug" element={<BusinessProfilePage />} />
                    </Route>

                    <Route element={<PublicLayout />}>
                        <Route path="/add-your-buisness" element={<LandingPage />} />
                        <Route path="/features" element={<FeaturesPage />} />
                        <Route path="/pricing" element={<PricingPage />} />
                        <Route path="/signup" element={<SignUpPage />} />
                        <Route path="/demo" element={<SignUpPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/contact" element={<ContactPage />} />
                        <Route path="/payment" element={<PaymentPage />} /> 
                        <Route path="/terms" element={<TermsPage />} />
                        <Route path="/privacy" element={<PrivacyPage />} />
                        <Route path="/verify-payment" element={<VerifyPaymentPage />} />    
                        <Route path="/verify-upgrade" element={<VerifyUpgradePage />} /> 
                    </Route>

                    {/* --- PROTECTED APP --- */}
                    <Route path="/app" element={<ProtectedRoute allowInactive={true}><MainLayout /></ProtectedRoute>}>
                        {/* New accounts land straight on the dashboard. */}
                        <Route index element={<OnboardingRedirect />} />
                        <Route path="subscription" element={<AppSubscriptionPage />} />

                        {/* Always reachable on an empty wallet: dashboard, wallet flow, personal profile. */}
                        <Route path="dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                        <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                        <Route path="wallet">
                            <Route path="select-country" element={<WalletPaymentCountryPage />} />
                            <Route index element={<WalletTopUpPage />} />
                        </Route>
                        {/* Legacy onboarding routes — no longer forced, still reachable. */}
                        <Route path="onboarding">
                            <Route path="wallet" element={<WalletOnboardingPromptPage />} />
                            <Route path="business-profile" element={<BusinessProfileSetupPage />} />
                            <Route path="services-pricing" element={<AdminPricingPage />} />
                        </Route>

                        {/* Everything below requires a funded wallet (WalletGate). */}
                        <Route element={<ProtectedRoute />}>
                            <Route element={<WalletGate />}>
                                <Route path="manage" element={<ManageSystemPage />} />
                                <Route path="orders" element={<OrdersListPage />} />
                                <Route path="orders/new" element={<CreateOrderPage />} />
                                <Route path="orders/:id" element={<OrderDetailsPage />} />
                                <Route path="orders/:id/edit" element={<EditOrderPage />} />
                                <Route path="customers" element={<CustomerListPage />} />
                                <Route path="customers/new" element={<CustomerFormPage mode="create" />} />
                                <Route path="customers/:id/edit" element={<CustomerFormPage mode="edit" />} />
                                <Route path="customers/:id/details" element={<CustomerDetailsPage />} />
                                <Route path="payments" element={<DailyPaymentsPage />} />
                                <Route path="inbox" element={<InboxPage />} />
                                <Route path="business-profile" element={<BusinessProfileSetupPage />} />
                            </Route>
                        </Route>
                        <Route path="admin" element={<AdminRoute />}>
                            <Route element={<WalletGate />}>
                                <Route index element={<Navigate to="settings" replace />} />
                                <Route path="settings" element={<SettingsPage />}/>
                                <Route path="pricing" element={<AdminPricingPage />}/>
                                <Route path="users" element={<ManageUsersPage />}/>
                                <Route path="directory" element={<ManageDirectoryPage />}/>
                            </Route>
                        </Route>
                    </Route>

                    <Route path="/directory-admin/login" element={<DirectoryAdminLoginPage />} />
                    <Route element={<DirectoryAdminRoute />}>
                        <Route path="/directory-admin/dashboard" element={<DirectoryAdminDashboard />} />
                    </Route>
                    
                </Routes>
            </Suspense>
        </DirectoryAuthProvider>
    );
}

export default App;