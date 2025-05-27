// client/src/pages/Orders/OrderDetailsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchOrderById, updateExistingOrder, sendManualNotification } from '../../services/api';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Spinner from '../../components/UI/Spinner';
import OrderStatusBadge from '../../components/Dashboard/OrderStatusBadge';
import { ArrowLeft, Edit3, Printer, DollarSign, MessageSquare, AlertTriangle, CheckCircle2, Clock3, RefreshCw } from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';

const DetailItem = ({ label, value, className = "", children }) => (
    <div className={`py-3 sm:grid sm:grid-cols-3 sm:gap-4 border-b border-apple-gray-100 dark:border-apple-gray-800 last:border-b-0 ${className}`}>
        <dt className="text-sm font-medium text-apple-gray-500 dark:text-apple-gray-400">{label}</dt>
        <dd className="mt-1 text-sm text-apple-gray-900 dark:text-apple-gray-100 sm:mt-0 sm:col-span-2">
            {children || value || <span className="italic text-apple-gray-400 dark:text-apple-gray-500">N/A</span>}
        </dd>
    </div>
);

const OrderDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [isSendingNotification, setIsSendingNotification] = useState(false);

    const loadOrder = useCallback(async (showLoadingSpinner = true) => {
        if (showLoadingSpinner) setLoading(true);
        setError('');
        try {
            const { data } = await fetchOrderById(id);
            setOrder(data);
        } catch (err) {
            setError(err.response?.status === 404 ? 'Order not found.' : (err.response?.data?.message || 'Failed to fetch order details.'));
            console.error("Fetch Order Details Error:", err.response || err);
        } finally {
            if (showLoadingSpinner) setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadOrder();
    }, [loadOrder]);

    const handlePrintReceipt = () => window.print();

    const handleUpdateStatus = async (newStatus) => {
        if (!order || isUpdatingStatus) return;
        setIsUpdatingStatus(true);
        try {
            const payload = { status: newStatus };
            if (newStatus === 'Completed' && !order.actualPickupDate) {
                payload.actualPickupDate = new Date().toISOString();
            }
            const { data: updatedOrder } = await updateExistingOrder(order._id, payload);
            setOrder(updatedOrder);
            console.log(`Order status updated to ${newStatus}. Notified: ${updatedOrder.notified}, Method: ${updatedOrder.notificationMethod}`);
        } catch (err) {
            console.error("Failed to update status:", err.response?.data?.message || err.message);
            alert(`Error updating status: ${err.response?.data?.message || err.message}`);
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleRecordPayment = () => {
        alert("Record Payment UI/Modal to be implemented. This would involve updating 'amountPaid' and potentially calling updateExistingOrder.");
        // Example:
        // const paymentAmount = prompt("Enter amount paid:");
        // if (paymentAmount !== null) {
        //   const newAmountPaid = (order.amountPaid || 0) + parseFloat(paymentAmount);
        //   try {
        //     const { data: updatedOrder } = await updateExistingOrder(order._id, { amountPaid: newAmountPaid });
        //     setOrder(updatedOrder);
        //   } catch (error) { alert("Failed to record payment."); }
        // }
    };

    const handleSendNotification = async () => {
        if (!order || !order.customer || (!order.customer.email && !order.customer.phone)) {
            alert("Customer contact information (email or phone) is missing.");
            return;
        }
        if (isSendingNotification) return;

        setIsSendingNotification(true);
        try {
            const { data } = await sendManualNotification(order._id); // API call
            setOrder(data.order); // Update local order state with response from backend
            alert(data.message || "Notification sent successfully.");
        } catch (err) {
            alert(`Failed to send notification: ${err.response?.data?.message || err.message}`);
            console.error("Manual notification error:", err.response || err);
        } finally {
            setIsSendingNotification(false);
        }
    };

    if (loading && !order) return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
    if (error) return (
        <div className="text-center py-10">
            <AlertTriangle size={48} className="mx-auto text-apple-red mb-4" />
            <p className="text-xl text-apple-red">{error}</p>
            <Button onClick={() => navigate(-1)} variant="secondary" className="mt-4">Go Back</Button>
        </div>
    );
    if (!order) return null;

    const isOrderOverdue = order.expectedPickupDate && isPast(parseISO(order.expectedPickupDate)) && !['Completed', 'Cancelled'].includes(order.status);
    const canSendNotification = order.customer && (order.customer.email || order.customer.phone);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center space-x-2">
                    <Button variant="ghost" onClick={() => navigate(-1)} className="p-1.5 -ml-1.5">
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-semibold text-apple-gray-800 dark:text-apple-gray-100">Order Details</h1>
                        <p className="text-sm text-apple-gray-500 dark:text-apple-gray-400">Receipt # {order.receiptNumber}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="secondary" onClick={() => loadOrder(false)} iconLeft={<RefreshCw size={16}/>} isLoading={loading && !!order}>Refresh</Button>
                    <Button variant="secondary" onClick={handlePrintReceipt} iconLeft={<Printer size={16}/>}>Print</Button>
                    <Link to={`/orders/${order._id}/edit`}><Button variant="primary" iconLeft={<Edit3 size={16}/>}>Edit</Button></Link>
                </div>
            </div>

            {isOrderOverdue && (
                <Card className="bg-red-50 dark:bg-red-900/30 border-apple-red">
                    <div className="flex items-center p-4">
                        <AlertTriangle size={24} className="text-apple-red mr-3 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold text-apple-red">This order is overdue!</h3>
                            {order.expectedPickupDate && <p className="text-sm text-red-700 dark:text-red-300">Expected pickup was {format(parseISO(order.expectedPickupDate), 'MMM d, yyyy')}.</p>}
                        </div>
                    </div>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card title="Order Summary" contentClassName="p-4 sm:p-6 divide-y divide-apple-gray-100 dark:divide-apple-gray-800">
                        <DetailItem label="Current Status"><OrderStatusBadge status={order.status} /></DetailItem>
                        <DetailItem label="Drop-off Date" value={order.dropOffDate ? format(parseISO(order.dropOffDate), 'MMM d, yyyy, h:mm a') : 'N/A'} />
                        <DetailItem label="Expected Pickup" value={order.expectedPickupDate ? format(parseISO(order.expectedPickupDate), 'MMM d, yyyy, h:mm a') : 'N/A'} />
                        {order.actualPickupDate && <DetailItem label="Actual Pickup" value={format(parseISO(order.actualPickupDate), 'MMM d, yyyy, h:mm a')} />}
                        <DetailItem label="Total Amount" value={`$${(order.totalAmount || 0).toFixed(2)}`} />
                        <DetailItem label="Payment Status">
                            {order.isFullyPaid ?
                                <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-apple-green dark:bg-green-900/50 dark:text-green-400"><CheckCircle2 size={14} className="mr-1"/> Paid</span> :
                                <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-apple-orange dark:bg-yellow-900/50 dark:text-yellow-400"><Clock3 size={14} className="mr-1"/> Unpaid</span>
                            }
                            {order.amountPaid > 0 && <span className="ml-2 text-xs text-apple-gray-500 dark:text-apple-gray-400">(${(order.amountPaid || 0).toFixed(2)} received)</span>}
                        </DetailItem>
                        {order.notes && <DetailItem label="Order Notes" value={order.notes} />}
                        {order.createdBy && <DetailItem label="Created By" value={order.createdBy?.username || 'Staff'} />}
                        <DetailItem label="Notification Sent">
                            {order.notified
                                ? `Yes, via ${order.notificationMethod && order.notificationMethod !== 'none' ? order.notificationMethod : 'auto'}`
                                : 'No'
                            }
                        </DetailItem>
                    </Card>

                    <Card title="Customer Information" contentClassName="p-4 sm:p-6 divide-y divide-apple-gray-100 dark:divide-apple-gray-800">
                        <DetailItem label="Name" value={order.customer?.name} />
                        <DetailItem label="Phone" value={order.customer?.phone} />
                        <DetailItem label="Email" value={order.customer?.email} />
                        <DetailItem label="Address" value={order.customer?.address} />
                    </Card>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <Card title="Items in Order" contentClassName="p-4 sm:p-6">
                        {order.items && order.items.length > 0 ? (
                            <ul className="divide-y divide-apple-gray-200 dark:divide-apple-gray-700">
                                {order.items.map((item, index) => (
                                    <li key={item._id || index} className="py-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-medium text-apple-gray-900 dark:text-apple-gray-100">{item.quantity}x {item.itemType}</p>
                                                <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400">Service: {item.serviceType}</p>
                                            </div>
                                        </div>
                                        {item.specialInstructions && <p className="mt-1 text-xs text-apple-gray-500 dark:text-apple-gray-400 italic">Instructions: {item.specialInstructions}</p>}
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-sm text-apple-gray-500 dark:text-apple-gray-400">No items found.</p>}
                    </Card>

                    <Card title="Order Actions" contentClassName="p-4 sm:p-6">
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium mb-1 text-apple-gray-600 dark:text-apple-gray-300">Update Status:</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {['Pending', 'Processing', 'Ready for Pickup', 'Completed', 'Cancelled'].map(statusOption => (
                                    <Button
                                        key={statusOption}
                                        variant={order.status === statusOption ? "primary" : "secondary"}
                                        size="sm"
                                        onClick={() => handleUpdateStatus(statusOption)}
                                        disabled={isUpdatingStatus || order.status === statusOption || (order.status === 'Completed' && statusOption !== 'Completed') || (order.status === 'Cancelled' && statusOption !== 'Cancelled')}
                                        isLoading={isUpdatingStatus && order.status !== statusOption}
                                        className="w-full"
                                    >
                                        {statusOption}
                                    </Button>
                                ))}
                            </div>
                            <hr className="my-3 border-apple-gray-200 dark:border-apple-gray-700"/>
                            <Button variant="secondary" className="w-full" iconLeft={<DollarSign size={16}/>} onClick={handleRecordPayment}>Record Payment</Button>
                            <Button
                                variant="secondary"
                                className="w-full"
                                iconLeft={<MessageSquare size={16}/>}
                                onClick={handleSendNotification}
                                disabled={!canSendNotification || isSendingNotification}
                                isLoading={isSendingNotification}
                            >
                                {order.notified ? 'Resend Notification' : 'Send Notification'}
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsPage;