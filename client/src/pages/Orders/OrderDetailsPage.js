// client/src/pages/Orders/OrderDetailsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    fetchOrderById,
    updateExistingOrder,
    sendManualNotification,
    deleteOrderApi,
    recordPaymentApi,
    fetchAppSettings
} from '../../services/api';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Spinner from '../../components/UI/Spinner';
import OrderStatusBadge from '../../components/Dashboard/OrderStatusBadge';
import Modal from '../../components/UI/Modal';
import Input from '../../components/UI/Input';
import Select from '../../components/UI/Select';
import {
    ArrowLeft, Edit3, Printer, DollarSign, MessageSquare, AlertTriangle,
    CheckCircle2, Clock3, RefreshCw, Trash2
} from 'lucide-react';
import { format, parseISO, isPast, isValid as isValidDate } from 'date-fns';

const DetailItem = ({ label, value, className = "", children }) => (
    <div className={`py-3 sm:grid sm:grid-cols-3 sm:gap-4 border-b border-apple-gray-100 dark:border-apple-gray-800 px-4 sm:px-6 last:border-b-0 ${className}`}>
        <dt className="text-sm font-medium text-apple-gray-500 dark:text-apple-gray-400">{label}</dt>
        <dd className="mt-1 text-sm text-apple-gray-900 dark:text-apple-gray-100 sm:mt-0 sm:col-span-2">
            {children || value || <span className="italic text-apple-gray-400 dark:text-apple-gray-500">N/A</span>}
        </dd>
    </div>
);

const calculateItemPriceForReceipt = (item) => {
    let pricePerUnit = 0;
    const qty = parseInt(item.quantity, 10) || 0;
    if (qty <= 0) return 0;
    // NOTE: This pricing logic should ideally come from a shared utility that reads from your settings/pricelist
    if (item.serviceType === 'dry clean') pricePerUnit = 3000;
    else if (item.serviceType === 'wash & iron') pricePerUnit = 2000;
    else if (item.serviceType === 'iron') pricePerUnit = 500;
    else if (item.serviceType === 'wash') pricePerUnit = 1000;
    else if (item.serviceType === 'special care') pricePerUnit = 5000;
    else pricePerUnit = 2; // Default
    if (item.itemType === 'Suit') pricePerUnit *= 2;
    else if (item.itemType === 'Coat') pricePerUnit *= 1.5;
    return parseFloat((pricePerUnit * qty).toFixed(2));
};

const OrderDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [order, setOrder] = useState(null);
    const [settings, setSettings] = useState({ companyInfo: {}, defaultCurrencySymbol: 'FCFA' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionError, setActionError] = useState('');
    const [actionSuccess, setActionSuccess] = useState('');
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [isSendingNotification, setIsSendingNotification] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // State for the Payment Modal
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [isRecordingPayment, setIsRecordingPayment] = useState(false);

    const dateTimeFormat = 'MMM d, yyyy, h:mm a';

    const loadData = useCallback(async (showLoadingSpinner = true) => {
        if (showLoadingSpinner) setLoading(true);
        setError(''); setActionError(''); setActionSuccess('');
        try {
            const [orderResponse, settingsResponse] = await Promise.all([
                fetchOrderById(id),
                fetchAppSettings()
            ]);
            setOrder(orderResponse.data);
            setSettings(settingsResponse.data || { companyInfo: {}, defaultCurrencySymbol: 'FCFA' });
        } catch (err) {
            setError(err.response?.status === 404 ? 'Order not found.' : (err.response?.data?.message || 'Failed to load page data.'));
        } finally {
            if (showLoadingSpinner) setLoading(false);
        }
    }, [id]);

    useEffect(() => { loadData(); }, [loadData]);

    useEffect(() => {
        let timer;
        if (actionSuccess || actionError) {
            timer = setTimeout(() => { setActionSuccess(''); setActionError(''); }, 5000);
        }
        return () => clearTimeout(timer);
    }, [actionSuccess, actionError]);

    const handlePrintReceipt = () => window.print();

    const handleUpdateStatus = async (newStatus) => {
        if (!order || isUpdatingStatus) return;
        setIsUpdatingStatus(true); setActionError(''); setActionSuccess('');
        try {
            const payload = { status: newStatus };
            if (newStatus === 'Completed' && !order.actualPickupDate) payload.actualPickupDate = new Date().toISOString();
            const { data: updatedOrder } = await updateExistingOrder(order._id, payload);
            setOrder(updatedOrder);
            let successMsg = `Order status updated to ${newStatus}.`;
            if (newStatus === 'Ready for Pickup' && updatedOrder.notified && updatedOrder.notificationMethod && updatedOrder.notificationMethod !== 'none' && !updatedOrder.notificationMethod.startsWith('failed-')) {
                successMsg += ` Notification sent via ${updatedOrder.notificationMethod.replace('manual-', '')}.`;
            }
            setActionSuccess(successMsg);
        } catch (err) { setActionError(err.response?.data?.message || err.message || 'Error updating status.');
        } finally { setIsUpdatingStatus(false); }
    };

    const handleOpenPaymentModal = () => {
        if (!order) return;
        const balance = (order.totalAmount || 0) - (order.amountPaid || 0);
        setPaymentAmount(balance > 0 ? balance.toFixed(2) : '');
        setPaymentMethod('Cash');
        setShowPaymentModal(true);
        setActionError(''); // Clear any errors
    };

    const handleRecordPaymentSubmit = async (e) => {
        e.preventDefault();
        const amountToPay = parseFloat(paymentAmount);
        if (isNaN(amountToPay) || amountToPay <= 0) {
            // This error should ideally be displayed inside the modal
            alert("Please enter a valid, positive payment amount.");
            return;
        }

        setIsRecordingPayment(true);
        setActionError('');
        try {
            const payload = { amount: amountToPay, method: paymentMethod };
            const { data: updatedOrder } = await recordPaymentApi(order._id, payload);
            setOrder(updatedOrder); // Update the main order state with the response
            setShowPaymentModal(false); // Close the modal
            setPaymentAmount(''); // Reset form field
            setActionSuccess(`Payment of ${settings.defaultCurrencySymbol || '$'}${payload.amount.toFixed(2)} recorded successfully.`);
        } catch (err) {
            // For now, this error appears on the main page after the modal closes.
            // A better UX would be to have an error state for the modal itself.
            setActionError(err.response?.data?.message || "Failed to record payment.");
            setShowPaymentModal(false); // Also close modal on error
        } finally {
            setIsRecordingPayment(false);
        }
    };

    const handleSendNotification = async () => {
        if (!order?.customer || (!order.customer.email && !order.customer.phone)) { setActionError("Customer contact information is missing."); return; }
        if (isSendingNotification) return;
        setIsSendingNotification(true); setActionError(''); setActionSuccess('');
        try { const { data } = await sendManualNotification(order._id); setOrder(data.order); setActionSuccess(data.message); }
        catch (err) { setActionError(err.response?.data?.message || err.message || "Failed to send notification."); }
        finally { setIsSendingNotification(false); }
    };

    const handleDeleteOrder = async () => {
        if (!order) return;
        if (window.confirm(`Are you sure you want to permanently delete order #${order.receiptNumber}?`)) {
            setIsDeleting(true); setActionError(''); setActionSuccess('');
            try {
                await deleteOrderApi(order._id);
                setActionSuccess(`Order #${order.receiptNumber} deleted successfully.`);
                setTimeout(() => navigate('/app/dashboard'), 2000);
            } catch (err) {
                setActionError(err.response?.data?.message || `Failed to delete order.`);
            } finally {
                setIsDeleting(false);
            }
        }
    };

    if (loading) return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
    if (error) return ( <div className="text-center py-10 max-w-xl mx-auto"><Card><AlertTriangle size={48} className="mx-auto text-apple-red mb-4" /><p className="text-xl text-apple-red">{error}</p><Button onClick={() => navigate('/app/dashboard')} variant="secondary" className="mt-6">Back to Dashboard</Button></Card></div> );
    if (!order) return null;

    const isOrderOverdue = order.expectedPickupDate && isPast(parseISO(order.expectedPickupDate)) && !['Completed', 'Cancelled'].includes(order.status);
    const canSendNotification = order.customer && (order.customer.email || order.customer.phone);
    const balanceDueOnDetails = Math.max(0, (order.totalAmount || 0) - (order.amountPaid || 0));
    const currencySymbol = settings.defaultCurrencySymbol || '$';

    const formatDateSafe = (dateString) => {
        if (!dateString) return 'N/A';
        const date = parseISO(dateString);
        return isValidDate(date) ? format(date, dateTimeFormat) : 'Invalid Date';
    };

    return (
        <div className="space-y-6">
            <div className="print-hide">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center space-x-2"> <Button variant="ghost" onClick={() => navigate(-1)} className="p-1.5 -ml-1.5" aria-label="Go back"><ArrowLeft size={20} /></Button> <div><h1 className="text-2xl sm:text-3xl font-semibold">Order Details</h1><p className="text-sm text-apple-gray-500 dark:text-apple-gray-400">Receipt # {order.receiptNumber}</p></div> </div>
                    <div className="flex items-center space-x-2"> <Button variant="secondary" onClick={() => loadData(false)} iconLeft={<RefreshCw size={16}/>} isLoading={loading && !!order} disabled={loading && !!order}>Refresh</Button> <Button variant="secondary" onClick={handlePrintReceipt} iconLeft={<Printer size={16}/>}>Print Receipt</Button> <Link to={`/app/orders/${order._id}/edit`}>{/*<Button variant="primary" iconLeft={<Edit3 size={16}/>}>Edit Order</Button>*/}</Link> </div>
                </div>
                {isOrderOverdue && (<Card className="bg-red-100 dark:bg-red-900/40 border-2 border-red-400 dark:border-red-600 shadow-lg animate-pulse-slow"><div className="flex items-center p-4"><AlertTriangle size={32} className="text-red-600 dark:text-red-400 mr-4 flex-shrink-0" /><div><h3 className="text-lg font-semibold text-red-700 dark:text-red-300">Order Overdue!</h3>{order.expectedPickupDate && <p className="text-sm text-red-600 dark:text-red-500">Expected: {formatDateSafe(order.expectedPickupDate)}</p>}</div></div></Card>)}
                {actionSuccess && ( <div className="p-3 mb-4 bg-green-100 text-apple-green rounded-apple border border-green-300 dark:border-green-700 dark:text-green-300 dark:bg-green-900/30"> <div className="flex items-center"><CheckCircle2 size={20} className="mr-2 flex-shrink-0" /><span>{actionSuccess}</span></div> </div> )}
                {actionError && ( <div className="p-3 mb-4 bg-red-100 text-apple-red rounded-apple border border-red-300 dark:border-red-700 dark:text-red-300 dark:bg-red-900/30"> <div className="flex items-center"><AlertTriangle size={20} className="mr-2 flex-shrink-0" /><span>{actionError}</span></div> </div> )}
            </div>

            <div id="printable-receipt-area" className="hidden print:block">
                <div className="text-center mb-6 company-info-print"> <h2 className="text-xl font-bold text-black">{settings.companyInfo.name}</h2> <p className="text-xs text-gray-700">{settings.companyInfo.address}</p> <p className="text-xs text-gray-700">Phone: {settings.companyInfo.phone}</p> <hr className="my-3 border-dashed border-gray-400" /> </div>
                <div className="grid grid-cols-2 gap-x-4 mb-4 text-xs"> <div><span className="font-semibold">Receipt #:</span> {order.receiptNumber}</div> <div className="text-right"><span className="font-semibold">Date:</span> {formatDateSafe(order.createdAt)}</div> <div><span className="font-semibold">Customer:</span> {order.customer?.name}</div> <div className="text-right">{order.customer?.phone && <><span className="font-semibold">Phone:</span> {order.customer.phone}</>}</div> </div>
                {order.customer?.email && (<div className="text-xs mb-4"><span className="font-semibold">Email:</span> {order.customer.email}</div>)}
                <div className="text-xs mb-4"><span className="font-semibold">Expected Pickup:</span> {formatDateSafe(order.expectedPickupDate)}</div>
                <div className="mb-4">
                    <table className="w-full text-xs receipt-items-table">
                        <thead><tr className="border-b-2 border-t-2 border-dashed border-gray-400"><th className="py-1 text-left font-semibold">QTY</th><th className="py-1 text-left font-semibold">ITEM / SERVICE</th><th className="py-1 text-right font-semibold">PRICE</th></tr></thead>
                        <tbody>{order.items?.map((item, index) => { const itemLinePrice = calculateItemPriceForReceipt(item); return ( <tr key={index} className="border-b border-dotted border-gray-300"><td className="py-1.5 align-top">{item.quantity}x</td><td className="py-1.5 align-top">{item.itemType} - <span className="italic">{item.serviceType}</span>{item.specialInstructions && (<div className="text-[10px] text-gray-500 pl-2">↳ {item.specialInstructions}</div>)}</td><td className="py-1.5 align-top text-right">{currencySymbol}{itemLinePrice.toFixed(2)}</td></tr> ); })}</tbody>
                    </table>
                </div>
                <div className="mt-4 pt-2 border-t border-dashed border-gray-400 text-xs space-y-0.5">
                    <div className="flex justify-between"><span>Subtotal:</span><span>{currencySymbol}{(order.subTotalAmount || 0).toFixed(2)}</span></div>
                    {order.discountType !== 'none' && order.discountAmount > 0 && (<div className="flex justify-between"><span>Discount:</span><span>-{currencySymbol}{(order.discountAmount || 0).toFixed(2)}</span></div> )}
                    <div className="flex justify-between font-bold text-sm border-t border-dotted border-gray-300 mt-1 pt-1"><span>TOTAL:</span><span>{currencySymbol}{(order.totalAmount || 0).toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Advance Paid:</span><span>{currencySymbol}{(order.amountPaid || 0).toFixed(2)}</span></div>
                    <div className={`flex justify-between font-semibold`}><span>BALANCE DUE:</span><span>{currencySymbol}{balanceDueOnDetails.toFixed(2)}</span></div>
                </div>
                {order.notes && (<div className="mt-3 pt-2 border-t border-dashed border-gray-400"><h4 className="font-semibold text-xs mb-0.5">Order Notes:</h4><p className="text-[10px] whitespace-pre-wrap">{order.notes}</p></div> )}
                <div className="mt-6 text-center text-[10px] text-gray-500"><p>Thank you for your business!</p><p>{settings.companyInfo.name}</p></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print-hide">
                <div className="lg:col-span-2 space-y-6">
                    <Card title="Order Details" contentClassName="p-0">
                        <dl className="divide-y divide-apple-gray-100 dark:divide-apple-gray-800">
                            <DetailItem label="Current Status"><OrderStatusBadge status={order.status} /></DetailItem>
                            <DetailItem label="Order Placed" value={formatDateSafe(order.createdAt)} />
                            <DetailItem label="Drop-off" value={formatDateSafe(order.dropOffDate)} />
                            <DetailItem label="Expected Pickup" value={formatDateSafe(order.expectedPickupDate)} />
                            {order.actualPickupDate && <DetailItem label="Actual Pickup" value={formatDateSafe(order.actualPickupDate)} />}
                            <DetailItem label="Subtotal" value={`${currencySymbol}${(order.subTotalAmount || 0).toFixed(2)}`} />
                            {order.discountType !== 'none' && order.discountAmount > 0 && ( <DetailItem label={`Discount (${order.discountType === 'percentage' ? `${order.discountValue}%` : 'Fixed'})`} value={`-${currencySymbol}${(order.discountAmount || 0).toFixed(2)}`} className="text-orange-600 dark:text-orange-400" /> )}
                            <DetailItem label="Final Total" value={`${currencySymbol}${(order.totalAmount || 0).toFixed(2)}`} className="font-semibold text-lg" />
                            <DetailItem label="Advance Paid" value={`${currencySymbol}${(order.amountPaid || 0).toFixed(2)}`} />
                            <DetailItem label="Balance Due" className={`font-semibold ${balanceDueOnDetails > 0 ? 'text-apple-red dark:text-red-400' : 'text-apple-green dark:text-green-400'}`}>{currencySymbol}{balanceDueOnDetails.toFixed(2)}</DetailItem>
                            <DetailItem label="Payment Status">
                                {order.isFullyPaid ? <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-apple-green dark:bg-green-900/50 dark:text-green-400"><CheckCircle2 size={14} className="mr-1"/> Paid in Full</span> : <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-apple-orange dark:bg-yellow-900/50 dark:text-yellow-400"><Clock3 size={14} className="mr-1"/> Unpaid / Partial</span> }
                            </DetailItem>
                            {order.notes && <DetailItem label="Order Notes" value={order.notes} />}
                            {order.createdBy && <DetailItem label="Processed By" value={order.createdBy?.username || 'Staff'} />}
                            <DetailItem label="Notification Sent">
                                {order.notified ? `Yes, via ${order.notificationMethod && order.notificationMethod !== 'none' && !order.notificationMethod.startsWith('failed-') && !order.notificationMethod.startsWith('no-') ? order.notificationMethod.replace('manual-', '') : 'auto (logs)'}` : 'No'}
                                {(order.notificationMethod?.startsWith('failed-') || order.notificationMethod?.startsWith('no-')) && <span className="text-xs text-apple-red ml-1">({order.notificationMethod.replace('-auto','').replace('-manual','')})</span>}
                            </DetailItem>
                        </dl>
                    </Card>
                    <Card title="Customer Information" contentClassName="p-0">
                        <dl className="divide-y divide-apple-gray-100 dark:divide-apple-gray-800">
                            <DetailItem label="Name" value={order.customer?.name} />
                            <DetailItem label="Phone" value={order.customer?.phone} />
                            <DetailItem label="Email" value={order.customer?.email} />
                            <DetailItem label="Address" value={order.customer?.address} />
                        </dl>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <Card title="Items in Order" contentClassName="p-4 sm:p-6">
                        {order.items && order.items.length > 0 ? ( <ul className="divide-y divide-apple-gray-200 dark:divide-apple-gray-700"> {order.items.map((item, index) => ( <li key={item._id || index} className="py-3"> <div className="flex justify-between items-start"> <div> <p className="text-sm font-medium">{item.quantity}x {item.itemType}</p> <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400">Service: {item.serviceType}</p> </div> <p className="text-sm font-medium">{currencySymbol}{calculateItemPriceForReceipt(item).toFixed(2)}</p> </div> {item.specialInstructions && <p className="mt-1 text-xs italic">Instructions: {item.specialInstructions}</p>} </li> ))} </ul>
                        ) : <p className="text-sm">No items found.</p>}
                    </Card>
                    <Card title="Order Actions" contentClassName="p-4 sm:p-6">
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium mb-1">Update Status:</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {['Pending', 'Processing', 'Ready for Pickup', 'Completed', 'Cancelled'].map(status => (
                                    <Button key={status} variant={order.status === status ? "primary" : "secondary"} size="sm" onClick={() => handleUpdateStatus(status)}
                                        disabled={isUpdatingStatus || order.status === status || (order.status === 'Completed' && status !== 'Completed') || (order.status === 'Cancelled' && status !== 'Cancelled')}
                                        isLoading={isUpdatingStatus && order.status !== status} className="w-full">
                                        {status}
                                    </Button>
                                ))}
                            </div>
                            <hr className="my-3"/>
                            {!order.isFullyPaid && !['Completed', 'Cancelled'].includes(order.status) && (
                                <Button variant="secondary" className="w-full" iconLeft={<DollarSign size={16}/>} onClick={handleOpenPaymentModal}>Record Payment</Button>
                            )}
                            {order.isFullyPaid && (<div className="p-3 text-center bg-green-100 text-apple-green rounded-apple text-sm font-medium"><CheckCircle2 size={18} className="inline mr-2" />Order Fully Paid</div>)}
                            <hr className="my-3"/>
                            <Button variant="secondary" className="w-full" iconLeft={<MessageSquare size={16}/>} onClick={handleSendNotification}
                                disabled={!canSendNotification || isSendingNotification || order.status === 'Completed' || order.status === 'Cancelled' }
                                isLoading={isSendingNotification}>
                                {order.notified && !order.notificationMethod?.startsWith('failed-') ? 'Resend Notification' : 'Send Notification'}
                            </Button>
                           {user?.role === 'admin' && ( <> <hr className="my-3"/> {/*<Button variant="danger" className="w-full" iconLeft={<Trash2 size={16}/>} onClick={handleDeleteOrder} isLoading={isDeleting} disabled={isDeleting}> Delete This Order </Button>*/} </> )}
                        </div>
                    </Card>
                </div>
            </div>

            {showPaymentModal && order && (
                <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title={`Record Payment for Order #${order.receiptNumber}`}>
                    <form onSubmit={handleRecordPaymentSubmit}>
                        <div className="space-y-4">
                            <div className="p-3 bg-apple-gray-100 dark:bg-apple-gray-800 rounded-md text-sm"><div className="flex justify-between"><span>Total Amount:</span><span>{currencySymbol}{(order.totalAmount || 0).toFixed(2)}</span></div><div className="flex justify-between"><span>Currently Paid:</span><span>{currencySymbol}{(order.amountPaid || 0).toFixed(2)}</span></div><div className="flex justify-between font-semibold mt-1 pt-1 border-t"><span>Balance Due:</span><span className="text-apple-red">{currencySymbol}{balanceDueOnDetails.toFixed(2)}</span></div></div>
                            <Input label="Payment Amount" id="paymentAmount" type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} required min="0.01" step="0.01" prefix={currencySymbol}/>
                            <Select label="Payment Method" id="paymentMethod" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} options={[{ value: 'Cash', label: 'Cash' }, { value: 'Card', label: 'Credit/Debit Card' }, { value: 'Mobile Money', label: 'Mobile Money' }, { value: 'Other', label: 'Other' }]} />
                        </div>
                        <div className="mt-6 pt-4 border-t dark:border-apple-gray-700 flex justify-end space-x-3">
                            <Button type="button" variant="secondary" onClick={() => setShowPaymentModal(false)} disabled={isRecordingPayment}>Cancel</Button>
                            <Button type="submit" variant="primary" isLoading={isRecordingPayment}>Confirm Payment</Button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default OrderDetailsPage;