// client/src/pages/Dashboard/DashboardPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchDashboardOrderSummary, fetchDailyPaymentsReport } from '../../services/api';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Spinner from '../../components/UI/Spinner';
import OrderTable from '../../components/Dashboard/OrderTable';
import { trackEvent } from '../../utils/pixel'; 
import {
    PlusCircle, AlertTriangle, CheckCircle2, Clock3, Shirt, TrendingUp, ClipboardList,
    Zap, CreditCard, Store, HelpCircle, CirclePlay, Tags, Inbox, ShieldAlert
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useAppSettings } from '../../contexts/SettingsContext';
import { useLocalization } from '../../contexts/LocalizationContext';
import { useTranslation } from 'react-i18next';
import { useAppTour } from '../../contexts/AppTourContext';
import { getOnboardingStep, getOnboardingPath, isProfileComplete } from '../../utils/onboarding';

const StatCard = ({ title, value, icon, colorClass, isLoading }) => (
    <Card className={`shadow-apple-sm ${colorClass || 'bg-white dark:bg-apple-gray-800'}`}>
        <div className="flex items-center justify-between p-4">
            <div>
                <p className="text-sm font-medium text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wide">{title}</p>
                {isLoading ? <Spinner size="sm" className="mt-1.5" /> : <p className="text-2xl font-semibold text-apple-gray-900 dark:text-apple-gray-100">{value}</p>}
            </div>
            {icon && <div className={`p-2.5 rounded-full ${icon.props.className?.includes('text-') ? '' : 'bg-apple-blue/10 text-apple-blue'}`}>{icon}</div>}
        </div>
    </Card>
);


const DashboardPage = () => {
    const { settings } = useAppSettings();
    const { t } = useTranslation();
    const { user } = useAuth()
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [ordersError, setOrdersError] = useState('');
    const [stats, setStats] = useState({ total: 0, pending: 0, ready: 0, overdue: 0 });

    const [dailyTotalPayments, setDailyTotalPayments] = useState(0);
    const [loadingDailyPayments, setLoadingDailyPayments] = useState(true);
    const [dailyPaymentsError, setDailyPaymentsError] = useState('');
    const [showWalletModal, setShowWalletModal] = useState(false);

    const navigate = useNavigate();
    const { startTour } = useAppTour();
    const walletBalance = user?.tenant?.walletBalance ?? 0;
    const onboardingStep = getOnboardingStep(user);
    const onboardingComplete = onboardingStep === 'complete';
    const onboardingPath = getOnboardingPath(user);
    const profileComplete = isProfileComplete(user?.tenant);
    const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
    const navPath = (path) => (onboardingComplete ? path : onboardingPath);
    const { currencySymbol: localizationCurrencySymbol } = useLocalization();
    const currencySymbol = localizationCurrencySymbol || settings?.defaultCurrencySymbol || '$';
    const walletCurrency = '$';

    const handleNavigation = (e, path) => {
        if (walletBalance <= 0 && path !== '/app/wallet' && path !== '/app/wallet/select-country' && path !== '/app/dashboard') {
            e.preventDefault();
            setShowWalletModal(true);
        }
    };

    const loadOrders = useCallback(async () => {
        setLoadingOrders(true);
        setOrdersError('');
        try {
            const { data } = await fetchDashboardOrderSummary();
            setOrders(Array.isArray(data?.recentOrders) ? data.recentOrders : []);
            setStats({
                total: data.totalOrders ?? 0,
                pending: data.pendingCount ?? 0,
                ready: data.readyCount ?? 0,
                overdue: data.overdueCount ?? 0,
            });
        } catch (err) {
            const errMsg = err.response?.data?.message || t('dashboard.ordersError');
            setOrdersError(errMsg);
            setOrders([]);
            setStats({ total: 0, pending: 0, ready: 0, overdue: 0 });
        } finally {
            setLoadingOrders(false);
        }
    }, [t]);

     const loadDailyPayments = useCallback(async () => {
        // Only admins can see sales data
        if (user?.role !== 'admin') {
            setLoadingDailyPayments(false);
            return;
        }
        setLoadingDailyPayments(true);
        setDailyPaymentsError('');
        try {
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            const { data } = await fetchDailyPaymentsReport(todayStr);
            setDailyTotalPayments(data.totalAmountCollected || 0);
        } catch (err) {
            setDailyPaymentsError(t('dashboard.dailyPaymentsError'));
        } finally {
            setLoadingDailyPayments(false);
        }
    }, [t, user?.role]);

    // --- MAIN useEffect TO LOAD ALL DASHBOARD DATA ---
    useEffect(() => {
        loadOrders();
        loadDailyPayments();
        trackEvent('ViewContent', {
            content_name: 'Dashboard',
            content_category: 'Management',
        });
    }, [loadOrders, loadDailyPayments]);

    const previewOrders = orders;



    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl sm:text-3xl font-semibold text-apple-gray-800 dark:text-apple-gray-100">{t('dashboard.title')}</h1>
               <div className="flex items-center flex-wrap gap-2">
    <Link
        to={navPath('/app/orders')}
        onClick={(e) => handleNavigation(e, '/app/orders')}
    >
        <Button
            variant="secondary"
            size="md"
            iconLeft={<ClipboardList size={18} />}
        >
            {t('dashboard.viewAllOrders')}
        </Button>
    </Link>

    <Link
        to="/app/orders/new"
        onClick={(e) => handleNavigation(e, '/app/orders/new')}
    >
        <Button
            variant="primary"
            size="md"
            iconLeft={<PlusCircle size={18} />}
        >
            {t('dashboard.createNewOrder')}
        </Button>
    </Link>
</div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                 <Card className="shadow-apple-sm" title={t('dashboard.helpTitle')}>
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-apple-blue/10 text-apple-blue">
                            <HelpCircle size={22} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-apple-gray-600 dark:text-apple-gray-400">{t('dashboard.helpDescription')}</p>
                            <Button
                                type="button"
                                variant="primary"
                                size="sm"
                                className="mt-4"
                                iconLeft={<CirclePlay size={16} />}
                                onClick={startTour}
                            >
                                {t('dashboard.startTour')}
                            </Button>
                        </div>
                    </div>
                </Card>
                <Card className="lg:col-span-2 shadow-apple-sm" title={t('dashboard.quickLinks')}>
                    <p className="text-sm text-apple-gray-600 dark:text-apple-gray-400 mb-4">{t('dashboard.quickLinksDesc')}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <Link
                            to="/app/manage"
                            onClick={(e) => handleNavigation(e, '/app/manage')}
                            className="flex flex-col items-center gap-2 rounded-apple border border-apple-gray-200 dark:border-apple-gray-700 bg-apple-gray-50 dark:bg-apple-gray-900/50 p-4 text-center hover:border-apple-blue hover:bg-apple-blue-50 dark:hover:bg-apple-blue-950/30 transition-colors"
                        >
                            <ShieldAlert size={22} className="text-apple-blue" />
                            <span className="text-sm font-medium text-apple-gray-800 dark:text-apple-gray-100">{t('sidebar.navigation.manage')}</span>
                        </Link>
                        <Link
                            to="/app/orders"
                            onClick={(e) => handleNavigation(e, '/app/orders')}
                            className="flex flex-col items-center gap-2 rounded-apple border border-apple-gray-200 dark:border-apple-gray-700 bg-apple-gray-50 dark:bg-apple-gray-900/50 p-4 text-center hover:border-apple-blue hover:bg-apple-blue-50 dark:hover:bg-apple-blue-950/30 transition-colors"
                        >
                            <ClipboardList size={22} className="text-apple-blue" />
                            <span className="text-sm font-medium text-apple-gray-800 dark:text-apple-gray-100">{t('sidebar.navigation.orders')}</span>
                        </Link>
                        <Link
                            to="/app/inbox"
                            onClick={(e) => handleNavigation(e, '/app/inbox')}
                            className="flex flex-col items-center gap-2 rounded-apple border border-apple-gray-200 dark:border-apple-gray-700 bg-apple-gray-50 dark:bg-apple-gray-900/50 p-4 text-center hover:border-apple-blue hover:bg-apple-blue-50 dark:hover:bg-apple-blue-950/30 transition-colors"
                        >
                            <Inbox size={22} className="text-apple-blue" />
                            <span className="text-sm font-medium text-apple-gray-800 dark:text-apple-gray-100">{t('sidebar.navigation.inbox')}</span>
                        </Link>
                        {/*<Link
                            to="/app/customers"
                            onClick={(e) => handleNavigation(e, '/app/customers')}
                            className="flex flex-col items-center gap-2 rounded-apple border border-apple-gray-200 dark:border-apple-gray-700 bg-apple-gray-50 dark:bg-apple-gray-900/50 p-4 text-center hover:border-apple-blue hover:bg-apple-blue-50 dark:hover:bg-apple-blue-950/30 transition-colors"
                        >
                            <Users size={22} className="text-apple-blue" />
                            <span className="text-sm font-medium text-apple-gray-800 dark:text-apple-gray-100">{t('sidebar.navigation.customers')}</span>
                        </Link>*/}
                        <Link
                            to="/app/wallet"
                            className="flex flex-col items-center gap-2 rounded-apple border border-apple-gray-200 dark:border-apple-gray-700 bg-apple-gray-50 dark:bg-apple-gray-900/50 p-4 text-center hover:border-apple-blue hover:bg-apple-blue-50 dark:hover:bg-apple-blue-950/30 transition-colors"
                        >
                            <Zap size={22} className="text-amber-500" />
                            <span className="text-sm font-medium text-apple-gray-800 dark:text-apple-gray-100">{t('sidebar.navigation.topup')}</span>
                        </Link>
                        <Link
                            to="/app/payments"
                            onClick={(e) => handleNavigation(e, '/app/payments')}
                            className="flex flex-col items-center gap-2 rounded-apple border border-apple-gray-200 dark:border-apple-gray-700 bg-apple-gray-50 dark:bg-apple-gray-900/50 p-4 text-center hover:border-apple-blue hover:bg-apple-blue-50 dark:hover:bg-apple-blue-950/30 transition-colors"
                        >
                            <CreditCard size={22} className="text-apple-green" />
                            <span className="text-sm font-medium text-apple-gray-800 dark:text-apple-gray-100">{t('sidebar.navigation.payments')}</span>
                        </Link>
                        {isAdmin && (
                            <>
                                <Link
                                    to="/app/business-profile"
                                    onClick={(e) => handleNavigation(e, '/app/business-profile')}
                                    className="flex flex-col items-center gap-2 rounded-apple border border-apple-gray-200 dark:border-apple-gray-700 bg-apple-gray-50 dark:bg-apple-gray-900/50 p-4 text-center hover:border-apple-blue hover:bg-apple-blue-50 dark:hover:bg-apple-blue-950/30 transition-colors"
                                >
                                    <Store size={22} className="text-apple-blue" />
                                    <span className="text-sm font-medium text-apple-gray-800 dark:text-apple-gray-100">{t('sidebar.navigation.businessProfile')}</span>
                                </Link>
                                <Link
                            to="/app/admin/pricing"
                            onClick={(e) => handleNavigation(e, '/app/admin/pricing')}
                            className="flex flex-col items-center gap-2 rounded-apple border border-apple-gray-200 dark:border-apple-gray-700 bg-apple-gray-50 dark:bg-apple-gray-900/50 p-4 text-center hover:border-apple-blue hover:bg-apple-blue-50 dark:hover:bg-apple-blue-950/30 transition-colors"
                        >
                            <Tags size={22} className="text-apple-blue" />
                            <span className="text-sm font-medium text-apple-gray-800 dark:text-apple-gray-100">{t('sidebar.admin.servicesPricing')}</span>
                        </Link>
                               {/*<Link
                                    to="/app/admin/settings"
                                    onClick={(e) => handleNavigation(e, '/app/admin/settings')}
                                    className="flex flex-col items-center gap-2 rounded-apple border border-apple-gray-200 dark:border-apple-gray-700 bg-apple-gray-50 dark:bg-apple-gray-900/50 p-4 text-center hover:border-apple-blue hover:bg-apple-blue-50 dark:hover:bg-apple-blue-950/30 transition-colors"
                                >
                                    <Settings size={22} className="text-apple-gray-600" />
                                    <span className="text-sm font-medium text-apple-gray-800 dark:text-apple-gray-100">{t('sidebar.admin.settings')}</span>
                                </Link>*/}
                            </>
                        )}
                    </div>
                </Card>
            </div>

            {walletBalance <= 0 && (
                <div className="rounded-apple border border-apple-orange-200 bg-apple-orange-50 dark:border-apple-orange-700 dark:bg-apple-orange-950/30 p-5 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold text-apple-orange-900 dark:text-apple-orange-200">Wallet balance low</p>
                            <p className="mt-1 text-sm text-apple-gray-700 dark:text-apple-gray-300">
                                Your wallet balance is currently {walletCurrency} {walletBalance.toFixed(2)}. Add funds to continue using the pay-as-you-go wallet model.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="primary" onClick={() => navigate('/app/wallet/select-country')}>
                                Top Up Wallet
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {!profileComplete && isAdmin && (
                <div className="rounded-apple border border-apple-blue-200 dark:border-apple-blue-800 bg-apple-blue-50 dark:bg-apple-blue-950/40 p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold text-apple-blue-900 dark:text-apple-blue-100">{t('dashboard.completeProfileTitle')}</p>
                            <p className="text-sm text-apple-gray-600 dark:text-apple-gray-300">{t('dashboard.completeProfileDesc')}</p>
                        </div>
                        <Link 
                            to={navPath('/app/business-profile')}
                            onClick={(e) => handleNavigation(e, '/app/business-profile')}
                        >
                            <Button variant="primary" size="sm">{t('dashboard.completeProfileAction')}</Button>
                        </Link>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {user?.role === 'admin' && (
                    <StatCard
                        title={t('dashboard.todaysSales')}
                        value={`${currencySymbol} ${(typeof dailyTotalPayments === 'number' ? dailyTotalPayments.toFixed(2) : '0.00')}`}
                        icon={<TrendingUp size={24} className="text-green-500" />}
                        isLoading={loadingDailyPayments}
                    />
                )}
                <StatCard
                    title={t('dashboard.totalOrders')}
                    value={String(stats.total)}
                    icon={<Shirt size={24} className="text-apple-blue" />}
                    isLoading={loadingOrders && stats.total === 0 && !ordersError}
                />
                <StatCard
                    title={t('dashboard.pendingProcessing')}
                    value={String(stats.pending)}
                    icon={<Clock3 size={24} className="text-apple-orange" />}
                    isLoading={loadingOrders && orders.length === 0 && !ordersError}
                />
                <StatCard
                    title={t('dashboard.readyForPickup')}
                    value={String(stats.ready)}
                    icon={<CheckCircle2 size={24} className="text-apple-green" />}
                    isLoading={loadingOrders && orders.length === 0 && !ordersError}
                />
                <StatCard
                    title={t('dashboard.overdueOrders')}
                    value={String(stats.overdue)}
                    icon={<AlertTriangle size={24} className="text-apple-red" />}
                    colorClass={stats.overdue > 0 ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700' : ''}
                    isLoading={loadingOrders && orders.length === 0 && !ordersError}
                />
            </div>
            {dailyPaymentsError && <p className="text-xs text-center text-red-500 mt-1">{dailyPaymentsError}</p>}

            <Card title={t('dashboard.recentOrders')} className="overflow-visible relative" contentClassName="p-0 sm:p-0">
                <div className="px-4 sm:px-6 pt-2 pb-6">
                    <p className="text-sm text-apple-gray-600 dark:text-apple-gray-400 mb-4">{t('dashboard.recentOrdersDesc')}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                        <Link 
                            to="/app/orders?tab=active"
                            onClick={(e) => handleNavigation(e, '/app/orders')}
                        >
                            <Button variant="primary" size="sm">{t('ordersList.tabs.active')}</Button>
                        </Link>
                        {stats.overdue > 0 && (
                            <Link 
                                to="/app/orders?tab=overdue"
                                onClick={(e) => handleNavigation(e, '/app/orders')}
                            >
                                <Button variant="secondary" size="sm" iconLeft={<AlertTriangle size={14} />}>
                                    {t('ordersList.tabs.overdue')} ({stats.overdue})
                                </Button>
                            </Link>
                        )}
                        <Link 
                            to="/app/orders"
                            onClick={(e) => handleNavigation(e, '/app/orders')}
                        >
                            <Button variant="secondary" size="sm">{t('dashboard.viewAllOrders')}</Button>
                        </Link>
                    </div>
                    {loadingOrders && previewOrders.length === 0 ? (
                        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
                    ) : ordersError ? (
                        <p className="text-sm text-apple-red text-center py-6">{ordersError}</p>
                    ) : previewOrders.length === 0 ? (
                        <p className="text-sm text-apple-gray-500 text-center py-6">{t('dashboard.noOrdersFound')}</p>
                    ) : (
                        <OrderTable orders={previewOrders} />
                    )}
                </div>
            </Card>

            {/* Wallet Top Up Modal */}
            {showWalletModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-apple-gray-800 rounded-apple shadow-apple-lg max-w-md w-full mx-4 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
                                <Zap size={24} className="text-amber-600 dark:text-amber-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-apple-gray-900 dark:text-white">Top Up Wallet Required</h3>
                        </div>
                        <p className="text-sm text-apple-gray-600 dark:text-apple-gray-300 mb-6">
                            Your wallet balance is currently {walletCurrency} {walletBalance.toFixed(2)}. Please top up your wallet to access this feature.
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button
                                variant="secondary"
                                onClick={() => setShowWalletModal(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => {
                                    setShowWalletModal(false);
                                    navigate('/app/wallet/select-country');
                                }}
                                iconLeft={<Zap size={16} />}
                            >
                                Top Up Wallet
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default DashboardPage;