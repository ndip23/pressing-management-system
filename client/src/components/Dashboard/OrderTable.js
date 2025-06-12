// client/src/components/Dashboard/OrderTable.js
import React from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO, isPast } from 'date-fns';
import { Edit3, Eye, AlertTriangle, CheckCircle2, Clock3, DollarSign, Trash2 } from 'lucide-react';
import OrderStatusBadge from './OrderStatusBadge';
import Button from '../UI/Button';
import { markOrderPaidApi } from '../../services/api'; // Assuming services/api is correctly pathed

const OrderTable = ({ orders, onOrderUpdate, /* onDeleteOrder - if implementing delete */ }) => {
    const currencySymbol = 'FCFA'; // Or get from a global context/settings

    console.log("[OrderTable] Rendering. Received 'orders' prop with length:", orders ? orders.length : 'undefined/null');
    if (orders && orders.length > 0) {
        // console.log("[OrderTable] First order data:", JSON.stringify(orders[0], null, 2));
    }


    const handleMarkAsPaid = async (orderId, orderReceipt) => {
        console.log("[OrderTable] handleMarkAsPaid called for orderId:", orderId);
        if (window.confirm(`Are you sure you want to mark order #${orderReceipt} as fully paid?`)) {
            try {
                const { data: updatedOrder } = await markOrderPaidApi(orderId);
                if (onOrderUpdate) {
                    onOrderUpdate(updatedOrder);
                }
                console.log(`[OrderTable] Order ${orderReceipt} marked as paid. Updated data received by OrderTable:`, updatedOrder);
            } catch (error) {
                console.error("[OrderTable] Failed to mark order as paid:", error.response?.data || error.message || error);
                alert(`Error marking order as paid: ${error.response?.data?.message || error.message || 'Could not mark order as paid.'}`);
            }
        }
    };

    // The parent component (DashboardPage) will now handle displaying "No orders found" or loading states.
    // This component just renders the table if `orders` has items.
    if (!orders || !Array.isArray(orders)) {
        console.warn("[OrderTable] 'orders' prop is not a valid array. Received:", orders);
        return <div className="p-4 text-center text-apple-gray-500">Order data is not available or in an incorrect format.</div>;
    }

    // If orders is an empty array, the map will render nothing, which is fine.
    // DashboardPage shows the "No orders found matching criteria" message.

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
                        return (
                            <tr key={order._id} className={`${isOrderOverdue ? 'bg-red-50/50 dark:bg-red-900/10' : ''} hover:bg-apple-gray-50/70 dark:hover:bg-apple-gray-800/70 transition-colors duration-150`}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                    <Link to={`/orders/${order._id}`} className="text-apple-blue hover:text-apple-blue-dark dark:text-apple-blue-light dark:hover:text-apple-blue hover:underline">{order.receiptNumber}</Link>
                                    {isOrderOverdue && <AlertTriangle size={14} className="inline ml-1.5 text-apple-red" title="Overdue"/>}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-apple-gray-700 dark:text-apple-gray-300">
                                    {order.customer?.name || 'N/A'}
                                    <div className="text-xs text-apple-gray-500 dark:text-apple-gray-400">{order.customer?.phone}</div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-apple-gray-500 dark:text-apple-gray-400">{order.dropOffDate ? format(parseISO(order.dropOffDate), 'MMM d, yyyy') : 'N/A'}</td>
                                <td className={`px-4 py-3 whitespace-nowrap text-sm ${isOrderOverdue ? 'font-semibold text-apple-red dark:text-red-400' : 'text-apple-gray-500 dark:text-apple-gray-400'}`}>{order.expectedPickupDate ? format(parseISO(order.expectedPickupDate), 'MMM d, yyyy') : 'N/A'}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm"><OrderStatusBadge status={order.status} /></td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    {order.isFullyPaid ?
                                        <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-apple-green dark:bg-green-900/50 dark:text-green-400"><CheckCircle2 size={14} className="mr-1"/> Paid</span> :
                                        <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-apple-orange dark:bg-yellow-900/50 dark:text-yellow-400"><Clock3 size={14} className="mr-1"/> Unpaid</span>
                                    }
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-apple-gray-700 dark:text-apple-gray-300">{currencySymbol}{(order.totalAmount || 0).toFixed(2)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                                    <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                                        {!order.isFullyPaid && !['Completed', 'Cancelled'].includes(order.status) && (
                                            <Button variant="ghost" size="sm" onClick={() => handleMarkAsPaid(order._id, order.receiptNumber)} className="p-1.5 text-apple-green hover:bg-green-100 dark:hover:bg-green-700/50 rounded-full" title="Mark as Fully Paid">
                                                <DollarSign size={18} />
                                            </Button>
                                        )}
                                        <Link to={`/orders/${order._id}`} className="p-1.5 rounded-full text-apple-gray-500 hover:bg-apple-gray-100 dark:text-apple-gray-400 dark:hover:bg-apple-gray-700 hover:text-apple-blue dark:hover:text-apple-blue-light" title="View Details"> <Eye size={18} /> </Link>
                                        <Link to={`/orders/${order._id}/edit`} className="p-1.5 rounded-full text-apple-gray-500 hover:bg-apple-gray-100 dark:text-apple-gray-400 dark:hover:bg-apple-gray-700 hover:text-apple-orange dark:hover:text-orange-400" title="Edit Order"> <Edit3 size={18} /> </Link>
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