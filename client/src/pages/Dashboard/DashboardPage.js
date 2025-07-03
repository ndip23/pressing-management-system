// client/src/pages/Dashboard/DashboardPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchOrders, fetchDailyPaymentsReport, updateExistingOrder, } from '../../services/api'; 
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Spinner from '../../components/UI/Spinner';
import OrderTable from '../../components/Dashboard/OrderTable';
import FilterControls from '../../components/Dashboard/FilterControls';
import Modal from '../../components/UI/Modal'; 
import Input from '../../components/UI/Input';   
import { PlusCircle, AlertTriangle, CheckCircle2, Clock3, Shirt, TrendingUp, Filter as FilterIcon, RotateCcw, Search as SearchIcon, DollarSign } from 'lucide-react'; // Added more icons
import { format, isPast, parseISO } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext'; 

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


    const currencySymbol = 'FCFA'; // TODO: Get from global settings context

    const loadOrders = useCallback(async () => {
        console.log("[DashboardPage] --- Initiating loadOrders ---");
        console.log("[DashboardPage] Current filters for fetchOrders:", JSON.stringify(filters, null, 2));
        setLoadingOrders(true);
        setOrdersError('');
        try {
            const { data } = await fetchOrders(filters); 
            console.log("[DashboardPage] RAW API Response from fetchOrders:", JSON.stringify(data, null, 2));


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
            const errMsg = err.response?.data?.message || 'Failed to fetch orders. Please try again.';
            setOrdersError(errMsg);
            setOrders([]); 
            setPagination({ currentPage: 1, totalPages: 0, totalOrders: 0 }); 
        } finally {
            setLoadingOrders(false);
        }
    }, [filters]); 

    // Calculate stats based on the currently fetched page of orders
    useEffect(() => {
        const now = new Date();
        setStats({
            total: pagination.totalOrders, // This is the grand total from backend
            pending: orders.filter(o => ['Pending', 'Processing'].includes(o.status)).length,
            ready: orders.filter(o => o.status === 'Ready for Pickup').length,
            overdue: orders.filter(o => o.expectedPickupDate && isPast(parseISO(o.expectedPickupDate)) && !['Completed', 'Cancelled'].includes(o.status)).length,
        });
    }, [orders, pagination.totalOrders]); // Recalculate when orders or totalOrders change
 const loadDailyPayments = useCallback(async () => {
        setLoadingDailyPayments(true);
        setDailyPaymentsError('');
        try {
            const todayStr = format(new Date(), 'yyyy-MM-dd'); 
            const { data } = await fetchDailyPaymentsReport(todayStr); 
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
        if (updatedOrder.isFullyPaid || (selectedOrderForPayment && updatedOrder.amountPaid > selectedOrderForPayment.amountPaid) ) {
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
        if (!selectedOrderForPayment || !paymentAmountInput) { setPaymentError("Please enter a payment amount."); return; }
        const amountToRecord = parseFloat(paymentAmountInput);
        if (isNaN(amountToRecord) || amountToRecord <= 0) { setPaymentError("Valid positive amount required."); return; }

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
            setPaymentSuccess(`${currencySymbol}${amountToRecord.toFixed(2)} payment recorded for #${updatedOrderFromAPI.receiptNumber}.`);
            handleOrderPaymentUpdated(updatedOrderFromAPI); 
            setTimeout(handleClosePaymentModal, 2000); 
        } catch (err) {
            setPaymentError(err.response?.data?.message || "Failed to record payment.");
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
        ordersContent = <div className="py-10 text-center text-apple-gray-500 dark:text-apple-gray-400">No orders found matching criteria.</div>;
    } else {
        ordersContent = (
            <>
               
                {loadingOrders && orders.length > 0 && ( <div className="absolute inset-0 bg-white/50 dark:bg-black/50 flex items-center justify-center z-10 rounded-b-apple-lg"><Spinner /></div> )}
                <OrderTable orders={orders} onRecordPaymentClick={handleOpenPaymentModal} /> 
                {pagination.totalOrders > 0 && pagination.totalPages > 1 && (
                    <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-2">
                        <span className="text-sm text-apple-gray-600 dark:text-apple-gray-400">Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalOrders} orders)</span>
                        <div className="flex space-x-2"> <Button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1 || loadingOrders} variant="secondary" size="sm">Previous</Button> <Button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage >= pagination.totalPages || loadingOrders} variant="secondary" size="sm">Next</Button> </div>
                    </div>
                )}
            </>
        );
    }
   


    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl sm:text-3xl font-semibold text-apple-gray-800 dark:text-apple-gray-100">Dashboard</h1>
                <div className="flex items-center space-x-2">
                    <Button onClick={() => setShowFilters(prev => !prev)} variant="secondary" size="md" iconLeft={<FilterIcon size={16}/>}>Filters {showFilters ? '(Hide)' : '(Show)'}</Button>
                    <Link to="/orders/new"><Button variant="primary" size="md" iconLeft={<PlusCircle size={18} />}>Create New Order</Button></Link>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {user?.role === 'admin' && ( <StatCard title="Today's Sales" value={`${currencySymbol} ${(typeof dailyTotalPayments === 'number' ? dailyTotalPayments.toFixed(2) : '0.00')}`} icon={<TrendingUp size={24} className="text-green-500" />} isLoading={loadingDailyPayments} /> )}
                <StatCard title="Total Orders" value={String(pagination.totalOrders)} icon={<Shirt size={24} className="text-apple-blue" />} isLoading={loadingOrders && pagination.totalOrders === 0 && !ordersError } />
                <StatCard title="Pending/Processing" value={String(stats.pending)} icon={<Clock3 size={24} className="text-apple-orange" />} isLoading={loadingOrders && orders.length === 0 && !ordersError} />
                <StatCard title="Ready for Pickup" value={String(stats.ready)} icon={<CheckCircle2 size={24} className="text-apple-green" />} isLoading={loadingOrders && orders.length === 0 && !ordersError} />
                <StatCard title="Overdue Orders" value={String(stats.overdue)} icon={<AlertTriangle size={24} className="text-apple-red" />} colorClass={stats.overdue > 0 ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700' : ''} isLoading={loadingOrders && orders.length === 0 && !ordersError} />
            </div>
            {dailyPaymentsError && <p className="text-xs text-center text-red-500 mt-1">{dailyPaymentsError}</p>}

            {showFilters && (
                <Card title="Filter Orders" className="mb-6">
                    <FilterControls filters={filters} onFilterChange={handleFilterChange} onResetFilters={handleResetFilters} onApplyFilters={loadOrders} />
                </Card>
            )}

            <Card title="Order List" className="overflow-visible relative" contentClassName="p-0 sm:p-0">
                <div className="px-4 sm:px-6 pb-6 relative"> 
                    {ordersContent}
                </div>
            </Card>

            {showPaymentModal && selectedOrderForPayment && (
                <Modal isOpen={showPaymentModal} onClose={handleClosePaymentModal} title={`Record Payment for Order #${selectedOrderForPayment.receiptNumber}`} size="md">
                    <div className="space-y-4">
                        {paymentSuccess && <p className="p-3 text-sm bg-green-100 text-apple-green rounded-apple flex items-center"><CheckCircle2 size={18} className="mr-2"/>{paymentSuccess}</p>}
                        {paymentError && <p className="p-3 text-sm bg-red-100 text-apple-red rounded-apple flex items-center"><AlertTriangle size={18} className="mr-2"/>{paymentError}</p>}
                        <div>
                            <p className="text-sm"><strong>Customer:</strong> {selectedOrderForPayment.customer?.name}</p>
                            <p className="text-sm"><strong>Total Amount:</strong> {currencySymbol}{(selectedOrderForPayment.totalAmount || 0).toFixed(2)}</p>
                            <p className="text-sm"><strong>Currently Paid:</strong> {currencySymbol}{(selectedOrderForPayment.amountPaid || 0).toFixed(2)}</p>
                            <p className="text-sm font-semibold">Balance Due: {currencySymbol}{Math.max(0, (selectedOrderForPayment.totalAmount || 0) - (selectedOrderForPayment.amountPaid || 0)).toFixed(2)}</p>
                        </div>
                        <Input label="Payment Amount to Add" id="paymentAmountInputModal" type="number" value={paymentAmountInput} onChange={(e) => setPaymentAmountInput(e.target.value)} placeholder="Enter amount" min="0.01" step="0.01" disabled={paymentSubmitting} required autoFocus/>
                        <div className="mt-6 flex justify-end space-x-3">
                            <Button variant="secondary" onClick={handleClosePaymentModal} disabled={paymentSubmitting}>Cancel</Button>
                            <Button variant="primary" onClick={handlePaymentSubmit} isLoading={paymentSubmitting} disabled={paymentSubmitting}>Submit Payment</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};
export default DashboardPage;