// client/src/pages/Dashboard/DashboardPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchOrders, fetchDailyPaymentsReport, updateExistingOrder, } from '../../services/api';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Spinner from '../../components/UI/Spinner';
import OrderTable from '../../components/Dashboard/OrderTable';
import FilterControls from '../../components/Dashboard/FilterControls';
import Modal from '../../components/UI/Modal';
import Input from '../../components/UI/Input';
import { trackEvent } from '../../utils/pixel'; 
import {
    PlusCircle, AlertTriangle, CheckCircle2, Clock3, Shirt, TrendingUp, Filter as FilterIcon,
    Users, Zap, CreditCard, Inbox, Store, Settings, HelpCircle, CirclePlay,
} from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';
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
    const [filters, setFilters] = useState({
        paid: '', overdue: '', customerName: '', status: '', receiptNumber: '', customerPhone: '',
        page: 1, pageSize: 10,
    });
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalOrders: 0 });
    const [stats, setStats] = useState({ total: 0, pending: 0, ready: 0, overdue: 0 });

    const [dailyTotalPayments, setDailyTotalPayments] = useState(0);
    const [loadingDailyPayments, setLoadingDailyPayments] = useState(true);
    const [dailyPaymentsError, setDailyPaymentsError] = useState('');

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
    const [paymentAmountInput, setPaymentAmountInput] = useState('');
    const [paymentSubmitting, setPaymentSubmitting] = useState(false);
    const [paymentError, setPaymentError] = useState('');
    const [paymentSuccess, setPaymentSuccess] = useState('');
    const [showFilters, setShowFilters] = useState(false);
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

    const loadOrders = useCallback(async () => {
        setLoadingOrders(true);
        setOrdersError('');
        try {
            const { data } = await fetchOrders(filters);

            if (data && Array.isArray(data.orders)) {
                setOrders(data.orders);
            } else {
                setOrders([]);
                console.warn("[DashboardPage] API response 'data.orders' is not an array or is missing.");
            }
            setPagination({
                currentPage: data.page || 1,
                totalPages: data.pages || 0,
                totalOrders: data.totalOrders || 0,
            });
        } catch (err) {
            const errMsg = err.response?.data?.message || t('dashboard.ordersError');
            setOrdersError(errMsg);
            setOrders([]);
            setPagination({ currentPage: 1, totalPages: 0, totalOrders: 0 });
        } finally {
            setLoadingOrders(false);
        }
    }, [filters, t]);

    // Calculate stats based on the currently fetched page of orders
    useEffect(() => {
        setStats({
            total: pagination.totalOrders, // This is the grand total from backend
            pending: orders.filter(o => ['Pending', 'Processing'].includes(o.status)).length,
            ready: orders.filter(o => o.status === 'Ready for Pickup').length,
            overdue: orders.filter(o => o.expectedPickupDate && isPast(parseISO(o.expectedPickupDate)) && !['Completed', 'Cancelled'].includes(o.status)).length,
        });
    }, [orders, pagination.totalOrders]);

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
        loadOrders(filters);
        loadDailyPayments();
         trackEvent('ViewContent', {
            content_name: 'Dashboard',
            content_category: 'Management',
        });
    }, [filters, loadOrders, loadDailyPayments]);

    const handleFilterChange = (newFilters) => setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
    const handleResetFilters = () => setFilters({ paid: '', overdue: '', customerName: '', status: '', receiptNumber: '', customerPhone: '', page: 1, pageSize: 10 });
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages && newPage !== pagination.currentPage && !loadingOrders) {
            setFilters(prev => ({ ...prev, page: newPage }));
        }
    };

    // This function is passed to OrderTable and potentially to a payment modal
    const handleOrderPaymentUpdated = (updatedOrder) => {
        // Update the specific order in the local 'orders' state
        setOrders(prevOrders =>
            prevOrders.map(o => (o._id === updatedOrder._id ? updatedOrder : o))
        );
        // If a payment was made, refresh daily sales (could also just add to existing total if API returns payment amount)
        if (updatedOrder.isFullyPaid || (selectedOrderForPayment && updatedOrder.amountPaid > selectedOrderForPayment.amountPaid)) {
            loadDailyPayments();
        }
        setSelectedOrderForPayment(updatedOrder); // Keep modal updated if still open
    };

    // --- Payment Modal Logic ---
    const handleOpenPaymentModal = (order) => {
        setSelectedOrderForPayment(order);
        setPaymentAmountInput(''); setPaymentError(''); setPaymentSuccess('');
        setShowPaymentModal(true);
    };
    const handleClosePaymentModal = () => { setShowPaymentModal(false); setSelectedOrderForPayment(null); };
    const handlePaymentSubmit = async () => {
        if (!selectedOrderForPayment || !paymentAmountInput) { setPaymentError(t('dashboard.paymentAmountRequired')); return; }
        const amountToRecord = parseFloat(paymentAmountInput);
        if (isNaN(amountToRecord) || amountToRecord <= 0) { setPaymentError(t('dashboard.validAmountRequired')); return; }

        setPaymentSubmitting(true); setPaymentError(''); setPaymentSuccess('');
        try {
            const currentOrder = selectedOrderForPayment;
            const newTotalAmountPaid = (currentOrder.amountPaid || 0) + amountToRecord;

            if (newTotalAmountPaid > currentOrder.totalAmount) {
                console.warn("Payment exceeds total amount due. Backend should handle this.");
            }

            const { data: updatedOrderFromAPI } = await updateExistingOrder(currentOrder._id, {
                amountPaid: newTotalAmountPaid
            });
            setPaymentSuccess(t('dashboard.paymentSuccess', {
                amount: `${currencySymbol}${amountToRecord.toFixed(2)}`,
                receiptNumber: updatedOrderFromAPI.receiptNumber
            }));
            handleOrderPaymentUpdated(updatedOrderFromAPI);
            setTimeout(handleClosePaymentModal, 2000);
        } catch (err) {
            setPaymentError(err.response?.data?.message || t('dashboard.paymentError'));
        } finally {
            setPaymentSubmitting(false);
        }
    };

    // --- Content for Order List ---
    let ordersContent;
    if (loadingOrders && orders.length === 0 && !ordersError) {
        ordersContent = <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
    } else if (ordersError) {
        ordersContent = <div className="p-4 text-center text-apple-red bg-red-50 dark:bg-red-900/30 rounded-apple"><AlertTriangle size={24} className="mx-auto mb-2" />{ordersError}</div>;
    } else if (!loadingOrders && orders.length === 0) {
        ordersContent = <div className="py-10 text-center text-apple-gray-500 dark:text-apple-gray-400">{t('dashboard.noOrdersFound')}</div>;
    } else {
        ordersContent = (
            <>

                {loadingOrders && orders.length > 0 && (<div className="absolute inset-0 bg-white/50 dark:bg-black/50 flex items-center justify-center z-10 rounded-b-apple-lg"><Spinner /></div>)}
                <OrderTable orders={orders} onRecordPaymentClick={handleOpenPaymentModal} />
                {pagination.totalOrders > 0 && pagination.totalPages > 1 && (
                    <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-2">
                        <span className="text-sm text-apple-gray-600 dark:text-apple-gray-400">
                            {t('dashboard.pageInfo', {
                                currentPage: pagination.currentPage,
                                totalPages: pagination.totalPages,
                                totalOrders: pagination.totalOrders
                            })}
                        </span>
                        <div className="flex space-x-2">
                            <Button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1 || loadingOrders} variant="secondary" size="sm">
                                {t('dashboard.previous')}
                            </Button>
                            <Button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage >= pagination.totalPages || loadingOrders} variant="secondary" size="sm">
                                {t('dashboard.next')}
                            </Button>
                        </div>
                    </div>
                )}
            </>
        );
    }



    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl sm:text-3xl font-semibold text-apple-gray-800 dark:text-apple-gray-100">{t('dashboard.title')}</h1>
                <div className="flex items-center space-x-2">
                    <Button onClick={() => setShowFilters(prev => !prev)} variant="secondary" size="md" iconLeft={<FilterIcon size={16} />}>
                        {t('dashboard.filters')} {showFilters ? t('dashboard.filtersHide') : t('dashboard.filtersShow')}
                    </Button>
                    <Link to="/app/orders/new">
                        <Button variant="primary" size="md" iconLeft={<PlusCircle size={18} />}>
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
                            to={navPath('/app/orders/new')}
                            className="flex flex-col items-center gap-2 rounded-apple border border-apple-gray-200 dark:border-apple-gray-700 bg-apple-gray-50 dark:bg-apple-gray-900/50 p-4 text-center hover:border-apple-blue hover:bg-apple-blue-50 dark:hover:bg-apple-blue-950/30 transition-colors"
                        >
                            <PlusCircle size={22} className="text-apple-blue" />
                            <span className="text-sm font-medium text-apple-gray-800 dark:text-apple-gray-100">{t('sidebar.navigation.newOrder')}</span>
                        </Link>
                        {/*<Link
                            to={navPath('/app/customers')}
                            className="flex flex-col items-center gap-2 rounded-apple border border-apple-gray-200 dark:border-apple-gray-700 bg-apple-gray-50 dark:bg-apple-gray-900/50 p-4 text-center hover:border-apple-blue hover:bg-apple-blue-50 dark:hover:bg-apple-blue-950/30 transition-colors"
                        >
                            <Users size={22} className="text-apple-blue" />
                            <span className="text-sm font-medium text-apple-gray-800 dark:text-apple-gray-100">{t('sidebar.navigation.customers')}</span>
                        </Link>*/}
                        <Link
                            to={onboardingComplete ? '/app/wallet' : (onboardingStep === 'wallet' ? '/app/wallet/select-country' : onboardingPath)}
                            className="flex flex-col items-center gap-2 rounded-apple border border-apple-gray-200 dark:border-apple-gray-700 bg-apple-gray-50 dark:bg-apple-gray-900/50 p-4 text-center hover:border-apple-blue hover:bg-apple-blue-50 dark:hover:bg-apple-blue-950/30 transition-colors"
                        >
                            <Zap size={22} className="text-amber-500" />
                            <span className="text-sm font-medium text-apple-gray-800 dark:text-apple-gray-100">{t('sidebar.navigation.wallet')}</span>
                        </Link>
                        <Link
                            to={navPath('/app/payments')}
                            className="flex flex-col items-center gap-2 rounded-apple border border-apple-gray-200 dark:border-apple-gray-700 bg-apple-gray-50 dark:bg-apple-gray-900/50 p-4 text-center hover:border-apple-blue hover:bg-apple-blue-50 dark:hover:bg-apple-blue-950/30 transition-colors"
                        >
                            <CreditCard size={22} className="text-apple-green" />
                            <span className="text-sm font-medium text-apple-gray-800 dark:text-apple-gray-100">{t('sidebar.navigation.payments')}</span>
                        </Link>
                        {/*<Link
                            to={navPath('/app/inbox')}
                            className="flex flex-col items-center gap-2 rounded-apple border border-apple-gray-200 dark:border-apple-gray-700 bg-apple-gray-50 dark:bg-apple-gray-900/50 p-4 text-center hover:border-apple-blue hover:bg-apple-blue-50 dark:hover:bg-apple-blue-950/30 transition-colors"
                        >
                            <Inbox size={22} className="text-apple-blue" />
                            <span className="text-sm font-medium text-apple-gray-800 dark:text-apple-gray-100">{t('sidebar.navigation.inbox')}</span>
                        </Link>*/}
                        {isAdmin && (
                            <>
                                <Link
                                    to={navPath('/app/business-profile')}
                                    className="flex flex-col items-center gap-2 rounded-apple border border-apple-gray-200 dark:border-apple-gray-700 bg-apple-gray-50 dark:bg-apple-gray-900/50 p-4 text-center hover:border-apple-blue hover:bg-apple-blue-50 dark:hover:bg-apple-blue-950/30 transition-colors"
                                >
                                    <Store size={22} className="text-apple-blue" />
                                    <span className="text-sm font-medium text-apple-gray-800 dark:text-apple-gray-100">{t('sidebar.navigation.businessProfile')}</span>
                                </Link>
                               {/*<Link
                                    to={navPath('/app/admin/settings')}
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
                        <Link to={navPath('/app/business-profile')}>
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
                    value={String(pagination.totalOrders)}
                    icon={<Shirt size={24} className="text-apple-blue" />}
                    isLoading={loadingOrders && pagination.totalOrders === 0 && !ordersError}
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

            {showFilters && (
                <Card title={t('dashboard.filterOrders')} className="mb-6">
                    <FilterControls filters={filters} onFilterChange={handleFilterChange} onResetFilters={handleResetFilters} onApplyFilters={loadOrders} />
                </Card>
            )}

            <Card title={t('dashboard.orderList')} className="overflow-visible relative" contentClassName="p-0 sm:p-0">
                <div className="px-4 sm:px-6 pb-6 relative">
                    {ordersContent}
                </div>
            </Card>

            {showPaymentModal && selectedOrderForPayment && (
                <Modal
                    isOpen={showPaymentModal}
                    onClose={handleClosePaymentModal}
                    title={t('dashboard.recordPayment', { receiptNumber: selectedOrderForPayment.receiptNumber })}
                    size="md"
                >
                    <div className="space-y-4">
                        {paymentSuccess && <p className="p-3 text-sm bg-green-100 text-apple-green rounded-apple flex items-center"><CheckCircle2 size={18} className="mr-2" />{paymentSuccess}</p>}
                        {paymentError && <p className="p-3 text-sm bg-red-100 text-apple-red rounded-apple flex items-center"><AlertTriangle size={18} className="mr-2" />{paymentError}</p>}
                        <div>
                            <p className="text-sm"><strong>{t('dashboard.customer')}:</strong> {selectedOrderForPayment.customer?.name}</p>
                            <p className="text-sm"><strong>{t('dashboard.totalAmount')}:</strong> {currencySymbol}{(selectedOrderForPayment.totalAmount || 0).toFixed(2)}</p>
                            <p className="text-sm"><strong>{t('dashboard.currentlyPaid')}:</strong> {currencySymbol}{(selectedOrderForPayment.amountPaid || 0).toFixed(2)}</p>
                            <p className="text-sm font-semibold">{t('dashboard.balanceDue')}: {currencySymbol}{Math.max(0, (selectedOrderForPayment.totalAmount || 0) - (selectedOrderForPayment.amountPaid || 0)).toFixed(2)}</p>
                        </div>
                        <Input
                            label={t('dashboard.paymentAmountToAdd')}
                            id="paymentAmountInputModal"
                            type="number"
                            value={paymentAmountInput}
                            onChange={(e) => setPaymentAmountInput(e.target.value)}
                            placeholder={t('dashboard.enterAmount')}
                            min="0.01"
                            step="0.01"
                            disabled={paymentSubmitting}
                            required
                            autoFocus
                        />
                        <div className="mt-6 flex justify-end space-x-3">
                            <Button variant="secondary" onClick={handleClosePaymentModal} disabled={paymentSubmitting}>
                                {t('dashboard.cancel')}
                            </Button>
                            <Button variant="primary" onClick={handlePaymentSubmit} isLoading={paymentSubmitting} disabled={paymentSubmitting}>
                                {t('dashboard.submitPayment')}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};
export default DashboardPage;