// client/src/components/Dashboard/OrderTable.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth
import { format, parseISO, isPast } from 'date-fns';
import { Edit3, Eye, AlertTriangle, CheckCircle2, Clock3, Trash2, Shirt } from 'lucide-react'; // Added Shirt and Trash2
import OrderStatusBadge from './OrderStatusBadge';
import Button from '../UI/Button'; // For the delete button

const OrderTable = ({ orders, onDeleteOrder }) => { // Added onDeleteOrder prop
    const { user } = useAuth(); // Get user to check role

    if (!orders || orders.length === 0) {
        return (
            <div className="text-center py-10">
                <Shirt size={48} className="mx-auto text-apple-gray-400 dark:text-apple-gray-500 mb-4" />
                <p className="text-apple-gray-600 dark:text-apple-gray-400">No orders found.</p>
                <p className="text-sm text-apple-gray-500 dark:text-apple-gray-500 mt-1">Try adjusting filters or create a new order.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-apple-gray-200 dark:divide-apple-gray-700">
                <thead className="bg-apple-gray-50 dark:bg-apple-gray-800/50">
                    <tr>
                        <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Receipt #</th>
                        <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Customer</th>
                        <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Drop-off</th>
                        <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Pickup Due</th>
                        <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Payment</th>
                        <th className="px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider">Total</th>
                        <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-apple-gray-200 dark:divide-apple-gray-700 bg-white dark:bg-apple-gray-900">
                    {orders.map(order => {
                        const isOrderOverdue = order.expectedPickupDate && isPast(parseISO(order.expectedPickupDate)) && !['Completed', 'Cancelled'].includes(order.status);
                        const currencySymbol = '$'; // TODO: Get from settings context

                        return (
                            <tr key={order._id} className={`${isOrderOverdue ? 'bg-red-50/50 dark:bg-red-900/10' : ''} hover:bg-apple-gray-50/70 dark:hover:bg-apple-gray-800/70 transition-colors duration-150`}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                    <Link to={`/orders/${order._id}`} className="text-apple-blue hover:underline dark:text-apple-blue-light">{order.receiptNumber}</Link>
                                    {isOrderOverdue && <AlertTriangle size={14} className="inline ml-1.5 text-apple-red" title="Overdue"/>}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">{order.customer?.name || 'N/A'}<div className="text-xs text-apple-gray-500 dark:text-apple-gray-400">{order.customer?.phone}</div></td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">{order.dropOffDate ? format(parseISO(order.dropOffDate), 'MMM d, yy') : 'N/A'}</td>
                                <td className={`px-4 py-3 whitespace-nowrap text-sm ${isOrderOverdue ? 'font-semibold text-apple-red dark:text-red-400' : ''}`}>{order.expectedPickupDate ? format(parseISO(order.expectedPickupDate), 'MMM d, yy') : 'N/A'}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm"><OrderStatusBadge status={order.status} /></td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    {order.isFullyPaid ? <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-apple-green dark:bg-green-900/50 dark:text-green-400"><CheckCircle2 size={14} className="mr-1"/> Paid</span> : <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-apple-orange dark:bg-yellow-900/50 dark:text-yellow-400"><Clock3 size={14} className="mr-1"/> Unpaid</span>}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium">{currencySymbol}{(order.totalAmount || 0).toFixed(2)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                                    <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                                        <Link to={`/orders/${order._id}`} className="p-1 rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-700" title="View Details"><Eye size={18} className="text-apple-gray-500 hover:text-apple-blue dark:text-apple-gray-400 dark:hover:text-apple-blue-light" /></Link>
                                        <Link to={`/orders/${order._id}/edit`} className="p-1 rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-700" title="Edit Order"><Edit3 size={18} className="text-apple-gray-500 hover:text-apple-orange dark:text-apple-gray-400 dark:hover:text-orange-400" /></Link>
                                        {user?.role === 'admin' && onDeleteOrder && ( // Show delete button only to admin AND if onDeleteOrder prop is passed
                                            {/*<Button variant="ghost" size="sm" onClick={() => onDeleteOrder(order._id, order.receiptNumber)} className="p-1 text-apple-gray-500 hover:text-apple-red dark:text-apple-gray-400 dark:hover:text-red-400" title="Delete Order">
                                                <Trash2 size={18} />
                                            </Button>*/}
                                        )}
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