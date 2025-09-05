// client/src/components/Dashboard/OrderTable.js
import React from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO, isPast } from 'date-fns';
import { useAppSettings } from '../../contexts/SettingsContext'; 
import {
    Edit3,
    Eye,
    AlertTriangle,
    CheckCircle2, 
    Clock3,       
    DollarSign,  
    Shirt,       
    // XCircle,      // Example: Could be used for a "Cancel Order" action icon
    // MoreHorizontal // Example: Could be used for a dropdown menu action icon
} from 'lucide-react';
import OrderStatusBadge from './OrderStatusBadge'; 
const OrderTable = ({ orders }) => {
    const { settings } = useAppSettings(); 
    if (!orders || orders.length === 0) {
        return (
            <div className="text-center py-10">
                <Shirt size={48} className="mx-auto text-apple-gray-400 dark:text-apple-gray-500 mb-4" />
                <p className="text-apple-gray-600 dark:text-apple-gray-400">No orders found.</p>
                <p className="text-sm text-apple-gray-500 dark:text-apple-gray-500 mt-1">
                    Try adjusting your filters or create a new order.
                </p>
            </div>
        );
    }


    const currencySymbol = settings.defaultCurrencySymbol;

    return (
        <div className="overflow-x-auto shadow-apple-md rounded-apple-lg">
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
                        const amountPaid = order.amountPaid || 0;
                        const isPartiallyPaid = amountPaid > 0 && !order.isFullyPaid;

                        return (
                            <tr key={order._id} className={`${isOrderOverdue ? 'bg-red-50/50 dark:bg-red-900/20' : ''} hover:bg-apple-gray-50/70 dark:hover:bg-apple-gray-800/60 transition-colors duration-150`}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                    <Link to={`/app/orders/${order._id}`} className="text-apple-blue hover:text-apple-blue-dark dark:text-apple-blue-light dark:hover:text-apple-blue hover:underline">
                                        {order.receiptNumber}
                                    </Link>
                                    {isOrderOverdue && <AlertTriangle size={14} className="inline ml-1.5 text-apple-red" title="Overdue"/>}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-apple-gray-700 dark:text-apple-gray-300">
                                    {order.customer?.name || 'N/A'}
                                    <div className="text-xs text-apple-gray-500 dark:text-apple-gray-400">{order.customer?.phone}</div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-apple-gray-500 dark:text-apple-gray-400">
                                    {order.dropOffDate ? format(parseISO(order.dropOffDate), 'MMM d, yyyy') : 'N/A'}
                                </td>
                                <td className={`px-4 py-3 whitespace-nowrap text-sm ${isOrderOverdue ? 'font-semibold text-apple-red dark:text-red-400' : 'text-apple-gray-500 dark:text-apple-gray-400'}`}>
                                    {order.expectedPickupDate ? format(parseISO(order.expectedPickupDate), 'MMM d, yyyy') : 'N/A'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    <OrderStatusBadge status={order.status} />
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    {order.isFullyPaid ? (
                                        <span className="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-100 text-apple-green dark:bg-green-700/30 dark:text-green-300">
                                            <CheckCircle2 size={14} className="mr-1.5 -ml-0.5"/> Paid
                                        </span>
                                    ) : isPartiallyPaid ? (
                                        <span className="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-800/40 dark:text-yellow-300">
                                         Partially Paid
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full bg-red-100 text-apple-red dark:bg-red-800/40 dark:text-red-300">
                                            <Clock3 size={14} className="mr-1.5 -ml-0.5"/> Unpaid
                                        </span>
                                    )}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-apple-gray-700 dark:text-apple-gray-300">
                                    {currencySymbol} {(order.totalAmount || 0).toFixed(2)}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                                    <div className="flex items-center justify-center space-x-2">
                                        {!order.isFullyPaid && ['Pending', 'Processing', 'Ready for Pickup'].includes(order.status) && (
                                            <Link
                                                to={`/app/orders/${order._id}#paymentAction`} 
                                                className="text-apple-blue hover:text-sky-600 dark:text-sky-400 dark:hover:text-sky-300 p-1 rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-700 transition-colors"
                                                title="Record Payment"
                                            >
                                                Pay
                                            </Link>
                                        )}
                                        <Link to={`/app/orders/${order._id}`} className="text-apple-gray-500 hover:text-apple-blue dark:text-apple-gray-400 dark:hover:text-apple-blue-light p-1 rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-700 transition-colors" title="View Details">
                                            <Eye size={18} />
                                        </Link>
                                      {/*<Link to={`/orders/${order._id}/edit`} className="text-apple-gray-500 hover:text-apple-orange dark:text-apple-gray-400 dark:hover:text-orange-400 p-1 rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-700 transition-colors" title="Edit Order">
                                            <Edit3 size={18} />
                                        </Link>*/}
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