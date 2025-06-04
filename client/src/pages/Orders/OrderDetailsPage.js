// client/src/pages/Orders/OrderDetailsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchOrderById, updateExistingOrder, sendManualNotification } from '../../services/api';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Spinner from '../../components/UI/Spinner';
import OrderStatusBadge from '../../components/Dashboard/OrderStatusBadge';
import { ArrowLeft, Edit3, Printer, DollarSign, MessageSquare, AlertTriangle, CheckCircle2, Clock3, RefreshCw, Mail, Phone, MapPin } from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';

// DetailItem for on-screen display
const ScreenDetailItem = ({ label, value, className = "", children }) => (
    <div className={`py-3 sm:grid sm:grid-cols-3 sm:gap-4 border-b border-apple-gray-100 dark:border-apple-gray-800 px-4 sm:px-6 last:border-b-0 ${className}`}>
        <dt className="text-sm font-medium text-apple-gray-500 dark:text-apple-gray-400">{label}</dt>
        <dd className="mt-1 text-sm text-apple-gray-900 dark:text-apple-gray-100 sm:mt-0 sm:col-span-2">
            {children || value || <span className="italic text-apple-gray-400 dark:text-apple-gray-500">N/A</span>}
        </dd>
    </div>
);

// ReceiptDetailItem for printable receipt
const ReceiptDetailItem = ({ label, value, children, className = "" }) => (
    <div className={`flex justify-between py-0.5 receipt-detail-item ${className}`}>
        <span className="font-medium receipt-label">{label}</span>
        <span className="receipt-value">{children || value || "N/A"}</span>
    </div>
);

const OrderDetailsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(''); // For initial page load errors
    const [actionError, setActionError] = useState(''); // For errors from button actions
    const [actionSuccess, setActionSuccess] = useState(''); // For success messages from button actions
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [isSendingNotification, setIsSendingNotification] = useState(false);

    const dateTimeFormat = 'MMM d, yyyy, h:mm a';
    const currencySymbol = '$'; // TODO: Replace with settings context if available

    const companyInfo = { // Placeholder - Fetch from settings context
        name: "PressFlow Solutions",
        address: "123 Clean St, Suite 100, Laundry City, LC 54321",
        phone: "(555) 773-7737",
    };

    const loadOrder = useCallback(async (showLoadingSpinner = true) => {
        if (showLoadingSpinner) setLoading(true);
        setError(''); setActionError(''); setActionSuccess('');
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

    useEffect(() => { loadOrder(); }, [loadOrder]);

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
            if (newStatus === 'Completed' && !order.actualPickupDate) {
                payload.actualPickupDate = new Date().toISOString();
            }
            const { data: updatedOrder } = await updateExistingOrder(order._id, payload);
            setOrder(updatedOrder);
            let successMsg = `Order status updated to ${newStatus}.`;
            if (newStatus === 'Ready for Pickup' && updatedOrder.notified && updatedOrder.notificationMethod && updatedOrder.notificationMethod !== 'none' && !updatedOrder.notificationMethod.startsWith('failed-')) {
                successMsg += ` Notification sent via ${updatedOrder.notificationMethod.replace('manual-', '')}.`;
            }
            setActionSuccess(successMsg);
        } catch (err) {
            setActionError(err.response?.data?.message || err.message || 'Error updating status.');
            console.error("Failed to update status:", err.response || err);
        } finally { setIsUpdatingStatus(false); }
    };

    const handleRecordPayment = () => {
        setActionError(''); setActionSuccess('');
        alert("Record Payment UI/Modal to be implemented.");
    };

    const handleSendNotification = async () => {
        if (!order?.customer || (!order.customer.email && !order.customer.phone)) {
            setActionError("Customer contact information (email or phone) is missing."); return;
        }
        if (isSendingNotification) return;
        setIsSendingNotification(true); setActionError(''); setActionSuccess('');
        try {
            const { data } = await sendManualNotification(order._id);
            setOrder(data.order);
            setActionSuccess(data.message);
        } catch (err) {
            setActionError(err.response?.data?.message || err.message || "Failed to send notification.");
            console.error("Manual notification error:", err.response || err);
        } finally { setIsSendingNotification(false); }
    };

    if (loading && !order) return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
    if (error && !order) return (
        <div className="text-center py-10 max-w-xl mx-auto">
            <Card>
                <AlertTriangle size={48} className="mx-auto text-apple-red mb-4" />
                <p className="text-xl text-apple-red">{error}</p>
                <Button onClick={() => navigate(-1)} variant="secondary" className="mt-6">Go Back</Button>
            </Card>
        </div>
    );
    if (!order) return null;

    const isOrderOverdue = order.expectedPickupDate && isPast(parseISO(order.expectedPickupDate)) && !['Completed', 'Cancelled'].includes(order.status);
    const canSendNotification = order.customer && (order.customer.email || order.customer.phone);

    return (
        <div className="space-y-6">
            {/* --- NON-PRINTABLE HEADER AND UI MESSAGES --- */}
            <div className="print-hide">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center space-x-2">
                        <Button variant="ghost" onClick={() => navigate(-1)} className="p-1.5 -ml-1.5" aria-label="Go back"><ArrowLeft size={20} /></Button>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-semibold text-apple-gray-800 dark:text-apple-gray-100">Order Details</h1>
                            <p className="text-sm text-apple-gray-500 dark:text-apple-gray-400">Receipt # {order.receiptNumber}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="secondary" onClick={() => loadOrder(false)} iconLeft={<RefreshCw size={16}/>} isLoading={loading && !!order} disabled={loading && !!order}>Refresh</Button>
                        <Button variant="secondary" onClick={handlePrintReceipt} iconLeft={<Printer size={16}/>}>Print Receipt</Button>
                        <Link to={`/orders/${order._id}/edit`}><Button variant="primary" iconLeft={<Edit3 size={16}/>}>Edit</Button></Link>
                    </div>
                </div>

                {isOrderOverdue && (
                    <Card className="bg-red-100 dark:bg-red-900/40 border-2 border-red-400 dark:border-red-600 shadow-lg animate-pulse-slow">
                        <div className="flex items-center p-4">
                            <AlertTriangle size={32} className="text-red-600 dark:text-red-400 mr-4 flex-shrink-0" />
                            <div>
                                <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">This Order is Overdue!</h3>
                                {order.expectedPickupDate && <p className="text-sm text-red-600 dark:text-red-500">Expected pickup was: {format(parseISO(order.expectedPickupDate), dateTimeFormat)}</p>}
                            </div>
                        </div>
                    </Card>
                )}
                {actionSuccess && (
                    <div className="p-3 mb-4 bg-green-100 text-apple-green rounded-apple border border-green-300 dark:border-green-700 dark:text-green-300 dark:bg-green-900/30">
                        <div className="flex items-center"><CheckCircle2 size={20} className="mr-2 flex-shrink-0" /><span>{actionSuccess}</span></div>
                    </div>
                )}
                {actionError && (
                    <div className="p-3 mb-4 bg-red-100 text-apple-red rounded-apple border border-red-300 dark:border-red-700 dark:text-red-300 dark:bg-red-900/30">
                        <div className="flex items-center"><AlertTriangle size={20} className="mr-2 flex-shrink-0" /><span>{actionError}</span></div>
                    </div>
                )}
            </div>
            {/* --- END OF NON-PRINTABLE HEADER --- */}


            {/* --- START OF PRINTABLE RECEIPT AREA --- */}
            <div id="printable-receipt-area">
                <div className="receipt-company-header text-center mb-4">
                    {companyInfo.logoUrl && <img src={companyInfo.logoUrl} alt={`${companyInfo.name} Logo`} className="receipt-logo mx-auto mb-2 object-contain" />}
                    <h2 className="receipt-company-name text-lg font-bold">{companyInfo.name}</h2>
                    <p className="receipt-company-details text-xs">{companyInfo.address}</p>
                    <p className="receipt-company-details text-xs">Phone: {companyInfo.phone}</p>
                </div>
                <hr className="receipt-hr my-2" />
                <div className="receipt-section">
                    <h3 className="receipt-section-title">Order: #{order.receiptNumber}</h3>
                    <ReceiptDetailItem label="Date Placed:" value={order.createdAt ? format(parseISO(order.createdAt), dateTimeFormat) : 'N/A'} />
                    <ReceiptDetailItem label="Expected Pickup:" value={order.expectedPickupDate ? format(parseISO(order.expectedPickupDate), dateTimeFormat) : 'N/A'} />
                    <ReceiptDetailItem label="Status:" value={order.status} />
                </div>
                <hr className="receipt-hr my-2" />
                <div className="receipt-section">
                    <h3 className="receipt-section-title">Customer:</h3>
                    <p className="receipt-customer-info">{order.customer?.name}</p>
                    {order.customer?.phone && <p className="receipt-customer-info">Phone: {order.customer.phone}</p>}
                    {order.customer?.email && <p className="receipt-customer-info">Email: {order.customer.email}</p>}
                </div>
                <hr className="receipt-hr my-2" />
                <div className="receipt-section">
                    <h3 className="receipt-section-title">Items:</h3>
                    <table className="receipt-items-table w-full">
                        <thead><tr><th className="qty">Qty</th><th className="desc">Description</th></tr></thead>
                        <tbody>
                            {order.items?.map((item, index) => ( <tr key={item._id || index}><td className="qty">{item.quantity}x</td><td className="desc">{item.itemType} ({item.serviceType}){item.specialInstructions && <div className="instr">↳ {item.specialInstructions}</div>}</td></tr>))}
                        </tbody>
                    </table>
                </div>
                <hr className="receipt-hr my-2" />
                <div className="receipt-section receipt-financials space-y-0.5">
                    <ReceiptDetailItem label="Subtotal:" value={`${currencySymbol}${(order.subTotalAmount || 0).toFixed(2)}`} />
                    {order.discountType !== 'none' && order.discountAmount > 0 && (<ReceiptDetailItem label={`Discount (${order.discountType === 'percentage' ? `${order.discountValue}%` : 'Fixed'}):`} value={`-${currencySymbol}${(order.discountAmount || 0).toFixed(2)}`} className="receipt-discount"/>)}
                    <ReceiptDetailItem label="Total:" value={`${currencySymbol}${(order.totalAmount || 0).toFixed(2)}`} className="receipt-total font-bold text-sm" />
                    <ReceiptDetailItem label="Amount Paid:" value={`${currencySymbol}${(order.amountPaid || 0).toFixed(2)}`} />
                    {(typeof order.totalAmount === 'number' && typeof order.amountPaid === 'number' && order.totalAmount > order.amountPaid) && (<ReceiptDetailItem label="Amount Due:" value={`${currencySymbol}${(order.totalAmount - order.amountPaid).toFixed(2)}`} className="receipt-amount-due font-semibold"/>)}
                </div>
                {order.notes && (<><hr className="receipt-hr my-2" /><div className="receipt-section"><h3 className="receipt-section-title">Notes:</h3><p className="receipt-notes">{order.notes}</p></div></>)}
                <hr className="receipt-hr my-2" />
                <p className="receipt-footer text-center text-xxs italic mt-4">Thank you for your business! Please bring this receipt for pickup.</p>
            </div>
            {/* --- END OF PRINTABLE RECEIPT AREA --- */}


            {/* --- NON-PRINTABLE UI CARDS (for screen display) --- */}
            <div className="print-hide grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card title="Order Summary" contentClassName="p-0">
                        <dl className="divide-y divide-apple-gray-100 dark:divide-apple-gray-800">
                            <ScreenDetailItem label="Current Status"><OrderStatusBadge status={order.status} /></ScreenDetailItem>
                            <ScreenDetailItem label="Order Placed" value={order.createdAt ? format(parseISO(order.createdAt), dateTimeFormat) : 'N/A'} />
                            <ScreenDetailItem label="Drop-off" value={order.dropOffDate ? format(parseISO(order.dropOffDate), dateTimeFormat) : 'N/A'} />
                            <ScreenDetailItem label="Expected Pickup" value={order.expectedPickupDate ? format(parseISO(order.expectedPickupDate), dateTimeFormat) : 'N/A'} />
                            {order.actualPickupDate && <ScreenDetailItem label="Actual Pickup" value={format(parseISO(order.actualPickupDate), dateTimeFormat)} />}
                            <ScreenDetailItem label="Subtotal" value={`${currencySymbol}${(order.subTotalAmount || 0).toFixed(2)}`} />
                            {order.discountType !== 'none' && typeof order.discountAmount === 'number' && order.discountAmount > 0 && ( <ScreenDetailItem label={`Discount (${order.discountType === 'percentage' ? `${order.discountValue || 0}%` : 'Fixed'})`} value={`-${currencySymbol}${(order.discountAmount).toFixed(2)}`} className="text-orange-600 dark:text-orange-400" /> )}
                            <ScreenDetailItem label="Final Total Amount" value={`${currencySymbol}${(order.totalAmount || 0).toFixed(2)}`} className="font-semibold text-lg" />
                            <ScreenDetailItem label="Amount Paid" value={`${currencySymbol}${(order.amountPaid || 0).toFixed(2)}`} />
                            <ScreenDetailItem label="Payment Status">
                                {order.isFullyPaid ? <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-apple-green dark:bg-green-900/50 dark:text-green-400"><CheckCircle2 size={14} className="mr-1"/> Paid</span> : <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-apple-orange dark:bg-yellow-900/50 dark:text-yellow-400"><Clock3 size={14} className="mr-1"/> Unpaid</span> }
                                {typeof order.amountPaid === 'number' && typeof order.totalAmount === 'number' && order.totalAmount > order.amountPaid && order.amountPaid >= 0 && ( <span className="ml-2 text-xs text-apple-gray-500 dark:text-apple-gray-400">({currencySymbol}{(order.totalAmount - order.amountPaid).toFixed(2)} due)</span> )}
                            </ScreenDetailItem>
                            {order.notes && <ScreenDetailItem label="Order Notes" value={order.notes} />}
                            {order.createdBy && <ScreenDetailItem label="Processed By" value={order.createdBy?.username || 'Staff'} />}
                            <ScreenDetailItem label="Notification Sent">
                                {order.notified ? `Yes, via ${order.notificationMethod && order.notificationMethod !== 'none' && !order.notificationMethod.startsWith('failed-') && !order.notificationMethod.startsWith('no-') ? order.notificationMethod.replace('manual-', '') : 'auto (logs)'}` : 'No'}
                                {(order.notificationMethod?.startsWith('failed-') || order.notificationMethod?.startsWith('no-')) && <span className="text-xs text-apple-red ml-1">({order.notificationMethod.replace('-auto','').replace('-manual','')})</span>}
                            </ScreenDetailItem>
                        </dl>
                    </Card>
                    <Card title="Customer Information" contentClassName="p-0">
                        <dl className="divide-y divide-apple-gray-100 dark:divide-apple-gray-800">
                           <ScreenDetailItem label="Name" value={order.customer?.name} />
                           <ScreenDetailItem label="Phone"><div className="flex items-center">{order.customer?.phone ? <><Phone size={14} className="mr-2 text-apple-gray-400" /><a href={`tel:${order.customer.phone}`} className="text-apple-blue hover:underline">{order.customer.phone}</a></> : <span className="italic">N/A</span>}</div></ScreenDetailItem>
                           <ScreenDetailItem label="Email">{order.customer?.email ? ( <div className="flex items-center"> <Mail size={14} className="mr-2 text-apple-gray-400" /> <a href={`mailto:${order.customer.email}`} className="text-apple-blue hover:underline">{order.customer.email}</a> </div> ) : (<span className="italic">N/A</span>)}</ScreenDetailItem>
                           <ScreenDetailItem label="Address">{order.customer?.address ? ( <div className="flex items-start"> <MapPin size={14} className="mr-2 mt-0.5 text-apple-gray-400 flex-shrink-0" /> <span className="whitespace-pre-line">{order.customer.address}</span> </div> ) : (<span className="italic">N/A</span>)}</ScreenDetailItem>
                        </dl>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <Card title="Items in Order" contentClassName="p-4 sm:p-6">
                        {order.items && order.items.length > 0 ? (
                            <ul className="divide-y divide-apple-gray-200 dark:divide-apple-gray-700">
                                {order.items.map((item, index) => ( <li key={item._id || index} className="py-3"> <div className="flex justify-between items-start"> <div> <p className="text-sm font-medium">{item.quantity}x {item.itemType}</p> <p className="text-xs text-apple-gray-500 dark:text-apple-gray-400">Service: {item.serviceType}</p> </div> </div> {item.specialInstructions && <p className="mt-1 text-xs italic">Instructions: {item.specialInstructions}</p>} </li> ))}
                            </ul>
                        ) : <p className="text-sm">No items found.</p>}
                    </Card>
                    <Card title="Order Actions" contentClassName="p-4 sm:p-6">
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium mb-1">Update Status:</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {['Pending', 'Processing', 'Ready for Pickup', 'Completed', 'Cancelled'].map(statusOption => (
                                    <Button key={statusOption} variant={order.status === statusOption ? "primary" : "secondary"} size="sm" onClick={() => handleUpdateStatus(statusOption)}
                                        disabled={isUpdatingStatus || order.status === statusOption || (order.status === 'Completed' && statusOption !== 'Completed') || (order.status === 'Cancelled' && statusOption !== 'Cancelled')}
                                        isLoading={isUpdatingStatus && order.status !== statusOption} className="w-full">
                                        {statusOption}
                                    </Button>
                                ))}
                            </div>
                            <hr className="my-3"/>
                            <Button variant="secondary" className="w-full" iconLeft={<DollarSign size={16}/>} onClick={handleRecordPayment}>Record Payment</Button>
                            <Button variant="secondary" className="w-full" iconLeft={<MessageSquare size={16}/>} onClick={handleSendNotification}
                                disabled={!canSendNotification || isSendingNotification || order.status === 'Completed' || order.status === 'Cancelled' }
                                isLoading={isSendingNotification}>
                                {order.notified && !order.notificationMethod?.startsWith('failed-') && !order.notificationMethod?.startsWith('no-') ? 'Resend Notification' : 'Send Notification'}
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
export default OrderDetailsPage;