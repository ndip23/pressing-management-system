// client/src/components/Dashboard/OrderTable.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO, isPast } from 'date-fns';
import { Eye, AlertTriangle, CheckCircle2, Clock3, DollarSign, Edit3 } from 'lucide-react'; // Edit3 is included if you decide to add it back based on some logic
import OrderStatusBadge from './OrderStatusBadge';
import Button from '../UI/Button';
import { markOrderPaidApi } from '../../services/api';

const OrderTable = ({ orders, onOrderUpdate }) => {
    const currencySymbol = 'FCFA';
    const [payingOrderId, setPayingOrderId] = useState(null);

    const handleMarkAsPaid = async (orderId, orderReceipt, totalAmount) => {
        if (!window.confirm(`Mark order #${orderReceipt} as fully paid? Amount Paid will be set to ${currencySymbol}${totalAmount.toFixed(2)}.`)) {
            return;
        }
        setPayingOrderId(orderId);
        try {
            const { data: updatedOrder } = await markOrderPaidApi(orderId);
            if (onOrderUpdate) {
                onOrderUpdate(updatedOrder);
            }
        } catch (error) {
            console.error("[OrderTable] Failed to mark order as paid:", error.response?.data || error.message || error);
            alert(`Error marking order as paid: ${error.response?.data?.message || error.message || 'Could not process payment.'}`);
        } finally {
            setPayingOrderId(null);
        }
    };

    if (!orders || !Array.isArray(orders)) {
        console.warn("[OrderTable] 'orders' prop is not a valid array. Received:", orders);
        return <div className="p-4 text-center text-apple-gray-500">Order data is not available.</div>;
    }

    return (
        <div className="overflow-x-auto rounded-apple-lg shadow-apple-sm border border-apple-gray-200 dark:border-apple-gray-700">
            <table className="min-w-full divide-y divide-apple-gray-200 dark:divide-apple-gray-700">
                <thead className="bg-apple-gray-50 dark:bg-apple-gray-800/50">
                    <tr>
                        <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wider">Receipt #</th>
                        <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wider">Customer</th>
                        <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wider">Drop-off</th>
                        <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wider">Pickup Due</th>
                        <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wider">Payment</th>
                        <th scope="col" className="px-4 py-3.5 text-right text-xs font-semibold text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wider">Total ({currencySymbol})</th>
                        <th scope="col" className="px-4 py-3.5 text-center text-xs font-semibold text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-apple-gray-200 dark:divide-apple-gray-700 bg-white dark:bg-apple-gray-900">
                    {orders.map(order => {
                        const isOrderOverdue = order.expectedPickupDate && isPast(parseISO(order.expectedPickupDate)) && !['Completed', 'Cancelled'].includes(order.status);
                        const showPayButton = !order.isFullyPaid && !['Completed', 'Cancelled'].includes(order.status);
                        const isProcessingThisPayment = payingOrderId === order._id;

                        return (
                            <tr key={order._id} className={`${isOrderOverdue ? 'bg-red-50/50 dark:bg-red-900/10' : ''} hover:bg-apple-gray-50/70 dark:hover:bg-apple-gray-800/70 transition-colors duration-150`}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium"><Link to={`/orders/${order._id}`} className="text-apple-blue hover:underline">{order.receiptNumber}</Link>{isOrderOverdue && <AlertTriangle size={14} className="inline ml-1.5 text-apple-red" title="Overdue"/>}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">{order.customer?.name || 'N/A'}<div className="text-xs text-apple-gray-500">{order.customer?.phone}</div></td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">{order.dropOffDate ? format(parseISO(order.dropOffDate), 'MMM d, yyyy') : 'N/A'}</td>
                                <td className={`px-4 py-3 whitespace-nowrap text-sm ${isOrderOverdue ? 'font-semibold text-apple-red' : ''}`}>{order.expectedPickupDate ? format(parseISO(order.expectedPickupDate), 'MMM d, yyyy') : 'N/A'}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm"><OrderStatusBadge status={order.status} /></td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">{order.isFullyPaid ? <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-apple-green"><CheckCircle2 size={14} className="mr-1"/> Paid</span> : <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-apple-orange"><Clock3 size={14} className="mr-1"/> Unpaid</span>}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium">{currencySymbol}{(order.totalAmount || 0).toFixed(2)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                                    <div className="flex items-center justify-center space-x-2">
                                        {showPayButton ? (
                                            <Button variant="success" size="sm" onClick={() => handleMarkAsPaid(order._id, order.receiptNumber, order.totalAmount)} isLoading={isProcessingThisPayment} disabled={isProcessingThisPayment} className="px-3 py-1 text-xs font-medium" title="Mark as Fully Paid">Pay</Button>
                                        ) : order.isFullyPaid ? (
                                            <Button variant="ghost" size="sm" disabled={true} className="px-3 py-1 text-xs text-apple-green cursor-default opacity-80" iconLeft={<CheckCircle2 size={14}/>}>Paid</Button>
                                        ) : (
                                            <span className="px-3 py-1 text-xs text-apple-gray-400">-</span>
                                        )}
                                        <Link to={`/orders/${order._id}`} className="p-1.5 rounded-full text-apple-gray-500 hover:bg-apple-gray-100 dark:text-apple-gray-400 dark:hover:bg-apple-gray-700 hover:text-apple-blue dark:hover:text-apple-blue-light" title="View Details"><Eye size={18} /></Link>
                                        {/* Edit button removed from table view as per request */}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
export default OrderTable;