// client/src/components/Dashboard/OrderTable.js
import React from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO, isPast } from 'date-fns';
import { Edit3, Eye, AlertTriangle, CheckCircle2, Clock3, DollarSign } from 'lucide-react'; // Added DollarSign
import OrderStatusBadge from './OrderStatusBadge';
import Button from '../UI/Button'; 
import { markOrderPaidApi } from '../../services/api'; 

const OrderTable = ({ orders, onOrderUpdate }) => { 

    const handleMarkAsPaid = async (orderId, orderReceipt) => {
        if (window.confirm(`Are you sure you want to mark order #${orderReceipt} as fully paid?`)) {
            try {
                const { data: updatedOrder } = await markOrderPaidApi(orderId);
                
                if (onOrderUpdate) {
                    onOrderUpdate(updatedOrder);
                }
                console.log(`Order ${orderReceipt} marked as paid.`);
            } catch (error) {
                console.error("Failed to mark order as paid:", error);
                alert(`Error: ${error.response?.data?.message || error.message || 'Could not mark order as paid.'}`);
            }
        }
    };


    if (!orders || orders.length === 0) 

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-apple-gray-200 dark:divide-apple-gray-700">
                <thead className="bg-apple-gray-50 dark:bg-apple-gray-800/50">
                    <tr>
                        <th scope="col" className="px-4 py-3.5 ...">Receipt #</th>
                        <th scope="col" className="px-4 py-3.5 ...">Customer</th>
                        <th scope="col" className="px-4 py-3.5 ...">Drop-off</th>
                        <th scope="col" className="px-4 py-3.5 ...">Pickup Due</th>
                        <th scope="col" className="px-4 py-3.5 ...">Status</th>
                        <th scope="col" className="px-4 py-3.5 ...">Payment</th>
                        <th scope="col" className="px-4 py-3.5 text-right ...">Total</th>
                        <th scope="col" className="px-4 py-3.5 text-center ...">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-apple-gray-200 dark:divide-apple-gray-700 bg-white dark:bg-apple-gray-900">
                    {orders.map(order => {
                        const isOrderOverdue = order.expectedPickupDate && isPast(parseISO(order.expectedPickupDate)) && !['Completed', 'Cancelled'].includes(order.status);
                        const currencySymbol = order.defaultCurrencySymbol || '$';
                        return (
                            <tr key={order._id} className={`${isOrderOverdue ? 'bg-red-50/50 dark:bg-red-900/10' : ''} hover:bg-apple-gray-50/70 dark:hover:bg-apple-gray-800/70 transition-colors duration-150`}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                    <Link to={`/orders/${order._id}`} className="text-apple-blue hover:underline ...">{order.receiptNumber}</Link>
                                    {isOrderOverdue && <AlertTriangle size={14} className="inline ml-1.5 text-apple-red" title="Overdue"/>}
                                </td>
                                <td className="px-4 py-3 ...">{order.customer?.name || 'N/A'}<div className="text-xs ...">{order.customer?.phone}</div></td>
                                <td className="px-4 py-3 ...">{order.dropOffDate ? format(parseISO(order.dropOffDate), 'MMM d, yyyy') : 'N/A'}</td>
                                <td className={`px-4 py-3 ... ${isOrderOverdue ? 'font-semibold text-apple-red dark:text-red-400' : '...'}`}>{order.expectedPickupDate ? format(parseISO(order.expectedPickupDate), 'MMM d, yyyy') : 'N/A'}</td>
                                <td className="px-4 py-3 ..."><OrderStatusBadge status={order.status} /></td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    {order.isFullyPaid ?
                                        <span className="inline-flex items-center ... bg-green-100 text-apple-green ..."><CheckCircle2 size={14} className="mr-1"/> Paid</span> :
                                        <span className="inline-flex items-center ... bg-yellow-100 text-apple-orange ..."><Clock3 size={14} className="mr-1"/> Unpaid</span>
                                    }
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium ...">{currencySymbol}{(order.totalAmount || 0).toFixed(2)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                                    <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                                        {!order.isFullyPaid && !['Completed', 'Cancelled'].includes(order.status) && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleMarkAsPaid(order._id, order.receiptNumber)}
                                                className="p-1 text-apple-green hover:bg-green-100 dark:hover:bg-green-700/50"
                                                title="Mark as Fully Paid"
                                            >
                                                <DollarSign size={18} />
                                            </Button>
                                        )}
                                        <Link to={`/orders/${order._id}`} className="p-1 rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-700" title="View Details">
                                            <Eye size={18} className="text-apple-gray-500 hover:text-apple-blue dark:text-apple-gray-400 dark:hover:text-apple-blue-light" />
                                        </Link>
                                        <Link to={`/orders/${order._id}/edit`} className="p-1 rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-700" title="Edit Order">
                                            <Edit3 size={18} className="text-apple-gray-500 hover:text-apple-orange dark:text-apple-gray-400 dark:hover:text-orange-400" />
                                        </Link>
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