// client/src/pages/Dashboard/DashboardPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchOrders, fetchDailyPaymentsReport } from '../../services/api';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Spinner from '../../components/UI/Spinner';
import OrderTable from '../../components/Dashboard/OrderTable';
import FilterControls from '../../components/Dashboard/FilterControls';
import { PlusCircle, AlertTriangle, CheckCircle2, Clock3, Shirt, TrendingUp } from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';

const DashboardPage = () => {
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

    const currencySymbol = 'FCFA'; // TODO: Get from settings context
    // REMOVED: const todayStr = format(new Date(), 'yyyy-MM-dd');
    // REMOVED: const { data } = await fetchDailyPaymentsReport(todayStr); // This was the error

    const loadOrders = useCallback(async () => {
        setLoadingOrders(true);
        setOrdersError('');
        try {
            const currentFilters = { ...filters, page: filters.page || 1 };
            const { data } = await fetchOrders(currentFilters);
            setOrders(data.orders || []);
            setPagination({
                currentPage: data.page || 1,
                totalPages: data.pages || 1,
                totalOrders: data.totalOrders || 0,
            });

            const now = new Date();
            const displayedOrders = data.orders || [];
            setStats({
                total: data.totalOrders || 0,
                pending: displayedOrders.filter(o => o.status === 'Pending' || o.status === 'Processing').length,
                ready: displayedOrders.filter(o => o.status === 'Ready for Pickup').length,
                overdue: displayedOrders.filter(o => o.expectedPickupDate && isPast(parseISO(o.expectedPickupDate)) && !['Completed', 'Cancelled'].includes(o.status)).length,
            });

        } catch (err) {
            setOrdersError(err.response?.data?.message || 'Failed to fetch orders. Please try again.');
            console.error("Fetch Orders Error:", err.response || err);
        } finally {
            setLoadingOrders(false);
        }
    }, [filters]);

    const loadDailyPayments = useCallback(async () => {
        setLoadingDailyPayments(true);
        setDailyPaymentsError('');
        try {
            const todayStr = format(new Date(), 'yyyy-MM-dd'); // Define todayStr INSIDE the async function
            const { data } = await fetchDailyPaymentsReport(todayStr); // API call INSIDE async function
            setDailyTotalPayments(data.totalAmountFromOrdersWithActivity || 0);
        } catch (err) {
            setDailyPaymentsError('Could not load daily sales data.');
            console.error("Fetch Daily Payments Error for Dashboard:", err.response?.data?.message || err.message || err);
        } finally {
            setLoadingDailyPayments(false);
        }
    }, []); // Empty dependency array means this function instance is stable

    useEffect(() => {
        loadOrders();
        loadDailyPayments();
    }, [loadOrders, loadDailyPayments]);

    const handleFilterChange = (newFilters) => {
        setFilters(prevFilters => ({ ...prevFilters, ...newFilters, page: 1 }));
    };

    const handleResetFilters = () => {
        setFilters({
            paid: '', overdue: '', customerName: '', status: '', receiptNumber: '', customerPhone: '',
            page: 1, pageSize: 10,
        });
    };

    const handlePageChange = (newPage) => {
        setFilters(prevFilters => ({ ...prevFilters, page: newPage }));
    };

    const StatCard = ({ title, value, icon, colorClass, isLoading }) => (
        <Card className={`shadow-apple-sm ${colorClass || 'bg-white dark:bg-apple-gray-800'}`}>
            <div className="flex items-center justify-between p-4">
                <div>
                    <p className="text-sm font-medium text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wide">{title}</p>
                    {isLoading ? <Spinner size="sm" className="mt-1.5"/> : <p className="text-2xl font-semibold text-apple-gray-900 dark:text-apple-gray-100">{value}</p>}
                </div>
                {icon && <div className={`p-2.5 rounded-full ${icon.props.className?.includes('text-') ? '' : 'bg-apple-blue/10 text-apple-blue'}`}>{icon}</div>}
            </div>
        </Card>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl sm:text-3xl font-semibold text-apple-gray-800 dark:text-apple-gray-100">Dashboard</h1>
                <Link to="/orders/new">
                    <Button variant="primary" size="md" iconLeft={<PlusCircle size={18} />}>
                        Create New Order
                    </Button>
                </Link>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard
                    title="Today's Sales"
                    value={`${currencySymbol}${dailyTotalPayments.toFixed(2)}`}
                    icon={<TrendingUp size={24} className="text-green-500" />}
                    isLoading={loadingDailyPayments}
                />
                <StatCard
                    title="Total Orders"
                    value={pagination.totalOrders}
                    icon={<Shirt size={24} className="text-apple-blue" />}
                    isLoading={loadingOrders && !orders.length && pagination.totalOrders === 0}
                />
                <StatCard
                    title="Pending/Processing"
                    value={stats.pending}
                    icon={<Clock3 size={24} className="text-apple-orange" />}
                    isLoading={loadingOrders && !orders.length}
                />
                <StatCard
                    title="Ready for Pickup"
                    value={stats.ready}
                    icon={<CheckCircle2 size={24} className="text-apple-green" />}
                    isLoading={loadingOrders && !orders.length}
                />
                <StatCard
                    title="Overdue Orders"
                    value={stats.overdue}
                    icon={<AlertTriangle size={24} className="text-apple-red" />}
                    colorClass={stats.overdue > 0 ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700' : ''}
                    isLoading={loadingOrders && !orders.length}
                />
            </div>
            {dailyPaymentsError && <p className="text-xs text-center text-red-500 mt-1">{dailyPaymentsError}</p>}

            <Card title="Manage Orders" className="overflow-visible" contentClassName="p-0 sm:p-0">
                 <FilterControls
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onResetFilters={handleResetFilters}
                    onApplyFilters={loadOrders} // This will trigger loadOrders which then triggers the useEffect containing loadDailyPayments if loadOrders changes
                />
                <div className="px-4 sm:px-6 pb-6">
                    {loadingOrders ? (
                        <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>
                    ) : ordersError ? (
                        <div className="p-4 text-center text-apple-red bg-red-50 dark:bg-red-900/30 rounded-apple">
                            <AlertTriangle size={24} className="mx-auto mb-2" />{ordersError}
                        </div>
                    ) : (
                        <>
                            <OrderTable orders={orders} />
                            {pagination.totalPages > 1 && (
                                <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-2">
                                    <span className="text-sm text-apple-gray-600 dark:text-apple-gray-400">
                                        Page {pagination.currentPage} of {pagination.totalPages} (Total: {pagination.totalOrders} orders)
                                    </span>
                                    <div className="flex space-x-2">
                                        <Button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1} variant="secondary" size="sm">Previous</Button>
                                        <Button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.totalPages} variant="secondary" size="sm">Next</Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default DashboardPage;