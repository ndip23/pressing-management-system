// client/src/App.js
import React, { Suspense, lazy } from 'react';
import AOS from "aos";
import "aos/dist/aos.css";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import PixelTracker from "./components/PixelTracker";
import { useAuth } from './contexts/AuthContext';
import { DirectoryAuthProvider } from './contexts/DirectoryAuthContext';
import MainLayout from './components/Layout/MainLayout';
import PublicLayout from './pages/Public/PublicLayout';
import DirectoryLayout from './pages/Public/DirectoryLayout';
import Spinner from './components/UI/Spinner';
import DirectoryAdminRoute from './components/Auth/DirectoryAdminRoute';

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
const VerifyPaymentPage = lazy(() => import('./pages/Public/VerifyPaymentPage'));
const VerifyUpgradePage = lazy(() => import('./pages/Public/VerifyUpgradePage'));
const ContactPage = lazy(() => import('./pages/Public/ContactPage')); 
const PaymentPage = lazy(() => import('./pages/Public/PaymentPage'));
const AppSubscriptionPage = lazy(() => import('./pages/User/AppSubscriptionPage'));
const SubscriptionRequiredPage = lazy(() => import('./pages/User/SubscriptionRequiredPage'));


const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return <div className="flex h-screen items-center justify-center"><Spinner size="lg"/></div>;
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// ✅ THE ENFORCER: Blocks access if trial is expired
const EnforceSubscription = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading || !user) return children;

    const status = user?.tenant?.subscriptionStatus;
    const isExpired = status === 'trial' && new Date() > new Date(user?.tenant?.trialEndsAt);
    const isPastDue = ['past_due', 'canceled', 'inactive'].includes(status);
    
    // Allow users to reach the subscription page to pay, but block everything else
    if ((isExpired || isPastDue) && !location.pathname.includes('/app/subscription')) {
        return <SubscriptionRequiredPage />;
    }
    return children;
};

const AdminRoute = ({ children }) => {
    const { user, isAuthenticated, loading } = useAuth();
    if (loading) return <div className="flex h-screen items-center justify-center"><Spinner size="lg"/></div>;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return user?.role === 'admin' ? children : <Navigate to="/app/dashboard" replace />;
};

function App() {
    React.useEffect(() => { AOS.init({ duration: 900, offset: 100, once: false, mirror: true }); }, []);

    return (
        <Router>
            <PixelTracker />
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
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/contact" element={<ContactPage />} />
                            <Route path="/payment" element={<PaymentPage />} /> 
                            <Route path="/verify-payment" element={<VerifyPaymentPage />} />    
                            <Route path="/verify-upgrade" element={<VerifyUpgradePage />} /> 
                        </Route>

                        {/* --- PROTECTED APP WITH ENFORCER --- */}
                        <Route path="/app" element={<ProtectedRoute><EnforceSubscription><MainLayout /></EnforceSubscription></ProtectedRoute>}>
                            <Route index element={<Navigate to="dashboard" replace />} />
                            <Route path="dashboard" element={<DashboardPage />} />
                            <Route path="subscription" element={<AppSubscriptionPage />} /> 
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

                        <Route path="/directory-admin/login" element={<DirectoryAdminLoginPage />} />
                        <Route element={<DirectoryAdminRoute />}>
                            <Route path="/directory-admin/dashboard" element={<DirectoryAdminDashboard />} />
                        </Route>
                        
                    </Routes>
                </Suspense>
            </DirectoryAuthProvider>
        </Router>
    );
}

export default App;