import React from 'react';
import { Link } from 'react-router-dom';
import { format, isPast } from 'date-fns';
import { Edit3, Eye, AlertTriangle, CheckCircle2, Clock3, Shirt } from 'lucide-react';
import OrderStatusBadge from './OrderStatusBadge';
import Button from '../UI/Button'; // For potential actions dropdown

const OrderTable = ({ orders }) => {
    if (!orders || orders.length === 0) {
        return (
            <div className="text-center py-10">
                <Shirt size={48} className="mx-auto text-apple-gray-400 dark:text-apple-gray-500 mb-4" />
                <p className="text-apple-gray-600 dark:text-apple-gray-400">No orders found.</p>
                <p className="text-sm text-apple-gray-500 dark:text-apple-gray-500 mt-1">Try adjusting your filters or create a new order.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-apple-gray-200 dark:divide-apple-gray-700">
                <thead className="bg-apple-gray-50 dark:bg-apple-gray-800/50">
                    <tr>
                        <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wider">Receipt #</th>
                        <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wider">Customer</th>
                        <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wider">Drop-off</th>
                        <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wider">Pickup Due</th>
                        <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-4 py-3.5 text-left text-xs font-semibold text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wider">Payment</th>
                        <th scope="col" className="px-4 py-3.5 text-right text-xs font-semibold text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wider">Total</th>
                        <th scope="col" className="px-4 py-3.5 text-center text-xs font-semibold text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-apple-gray-200 dark:divide-apple-gray-700 bg-white dark:bg-apple-gray-900">
                    {orders.map(order => {
                        const isOrderOverdue = isPast(new Date(order.expectedPickupDate)) && !['Completed', 'Cancelled'].includes(order.status);
                        return (
                            <tr key={order._id} className={`${isOrderOverdue ? 'bg-red-50/50 dark:bg-red-900/10' : ''} hover:bg-apple-gray-50/70 dark:hover:bg-apple-gray-800/70 transition-colors duration-150`}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                    <Link to={`/orders/${order._id}`} className="text-apple-blue hover:text-apple-blue-dark dark:text-apple-blue-light dark:hover:text-apple-blue hover:underline">
                                        {order.receiptNumber}
                                    </Link>
                                    {isOrderOverdue && <AlertTriangle size={14} className="inline ml-1.5 text-apple-red" title="Overdue"/>}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-apple-gray-700 dark:text-apple-gray-300">
                                    {order.customer?.name || 'N/A'}
                                    <div className="text-xs text-apple-gray-500 dark:text-apple-gray-400">{order.customer?.phone}</div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-apple-gray-500 dark:text-apple-gray-400">
                                    {order.dropOffDate ? format(new Date(order.dropOffDate), 'MMM d, yyyy') : 'N/A'}
                                </td>
                                <td className={`px-4 py-3 whitespace-nowrap text-sm ${isOrderOverdue ? 'font-semibold text-apple-red dark:text-red-400' : 'text-apple-gray-500 dark:text-apple-gray-400'}`}>
                                    {order.expectedPickupDate ? format(new Date(order.expectedPickupDate), 'MMM d, yyyy') : 'N/A'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    <OrderStatusBadge status={order.status} />
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    {order.isFullyPaid ?
                                        <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-apple-green dark:bg-green-900/50 dark:text-green-400">
                                            <CheckCircle2 size={14} className="mr-1"/> Paid
                                        </span> :
                                        <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-apple-orange dark:bg-yellow-900/50 dark:text-yellow-400">
                                            <Clock3 size={14} className="mr-1"/> Unpaid
                                        </span>
                                    }
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-apple-gray-700 dark:text-apple-gray-300">
                                    FCFA {(order.totalAmount || 0).toFixed(2)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                                    <div className="flex items-center justify-center space-x-2">
                                        <Link to={`/orders/${order._id}`} className="text-apple-gray-500 hover:text-apple-blue dark:text-apple-gray-400 dark:hover:text-apple-blue-light p-1 rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-700" title="View Details">
                                            <Eye size={18} />
                                        </Link>
                                        <Link to={`/orders/${order._id}/edit`} className="text-apple-gray-500 hover:text-apple-orange dark:text-apple-gray-400 dark:hover:text-orange-400 p-1 rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-700" title="Edit Order">
                                            <Edit3 size={18} />
                                        </Link>
                                        {/* Example for a dropdown menu for more actions */}
                                        {/* <div className="relative group">
                                            <Button variant="ghost" size="sm" className="p-1"><MoreHorizontal size={18}/></Button>
                                            <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-apple-gray-800 rounded-apple-md shadow-apple-lg py-1 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-150 ease-apple z-10">
                                                <button className="block w-full text-left px-3 py-1.5 text-xs text-apple-gray-700 dark:text-apple-gray-200 hover:bg-apple-gray-100 dark:hover:bg-apple-gray-700/50">Mark as Paid</button>
                                                <button className="block w-full text-left px-3 py-1.5 text-xs text-apple-red hover:bg-apple-gray-100 dark:hover:bg-apple-gray-700/50">Cancel Order</button>
                                            </div>
                                        </div> */}
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