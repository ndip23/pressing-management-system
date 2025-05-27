// client/src/pages/Dashboard/DashboardPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchOrders } from '../../services/api'; // Ensure this is the real API call
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Spinner from '../../components/UI/Spinner';
import OrderTable from '../../components/Dashboard/OrderTable';
import FilterControls from '../../components/Dashboard/FilterControls';
import { PlusCircle, AlertTriangle, CheckCircle2, Clock3, Shirt } from 'lucide-react'; // Added Shirt

const DashboardPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        paid: '', overdue: '', customerName: '', status: '', receiptNumber: '', customerPhone: '',
        page: 1, pageSize: 10, // Added for pagination
    });
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalOrders: 0 });
    const [stats, setStats] = useState({ total: 0, pending: 0, ready: 0, overdue: 0 });

    const loadOrders = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const currentFilters = { ...filters, page: filters.page || 1 }; // Ensure page is set
            const { data } = await fetchOrders(currentFilters); // Backend returns { orders, page, pages, totalOrders }
            setOrders(data.orders || []);
            setPagination({
                currentPage: data.page || 1,
                totalPages: data.pages || 1,
                totalOrders: data.totalOrders || 0,
            });

            // Calculate stats (client-side for now, backend could provide this)
            // For more accurate stats across all pages, backend should calculate them based on the full dataset before pagination.
            // The current stats are based on the fetched page of orders.
            const now = new Date();
            const displayedOrders = data.orders || [];
            setStats({
                total: data.totalOrders || 0, // Use total from backend
                // The following stats are for the CURRENTLY DISPLAYED page unless backend provides aggregated stats
                pending: displayedOrders.filter(o => o.status === 'Pending' || o.status === 'Processing').length,
                ready: displayedOrders.filter(o => o.status === 'Ready for Pickup').length,
                overdue: displayedOrders.filter(o => new Date(o.expectedPickupDate) < now && !['Completed', 'Cancelled'].includes(o.status)).length,
            });

        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch orders. Please try again.');
            console.error("Fetch Orders Error:", err.response || err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]); // `filters` is already a dependency of `loadOrders`

    const handleFilterChange = (newFilters) => {
        // When filters change, reset to page 1
        setFilters(prevFilters => ({ ...prevFilters, ...newFilters, page: 1 }));
    };

    const handleResetFilters = () => {
        setFilters({
            paid: '', overdue: '', customerName: '', status: '', receiptNumber: '', customerPhone: '',
            page: 1, pageSize: 10,
        });
    };

    const handlePageChange = (newPage) => {
        setFilters(prevFilters => ({ ...prevFilters, page: newPage }));
    };


    const StatCard = ({ title, value, icon, colorClass }) => (
        <Card className={`shadow-apple-sm ${colorClass || 'bg-white dark:bg-apple-gray-800'}`}>
            <div className="flex items-center justify-between p-4"> {/* Added padding to Card content */}
                <div>
                    <p className="text-sm font-medium text-apple-gray-500 dark:text-apple-gray-400 uppercase">{title}</p>
                    <p className="text-2xl font-semibold text-apple-gray-900 dark:text-apple-gray-100">{value}</p>
                </div>
                <div className={`p-2 rounded-full ${icon && icon.props.className ? '' : 'bg-apple-blue/10 text-apple-blue'}`}>
                    {icon}
                </div>
            </div>
        </Card>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl sm:text-3xl font-semibold text-apple-gray-800 dark:text-apple-gray-100">
                    Order Dashboard
                </h1>
                <Link to="/orders/new">
                    <Button variant="primary" size="md" iconLeft={<PlusCircle size={18} />}>
                        Create New Order
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Orders" value={stats.total} icon={<Shirt size={24} className="text-apple-blue" />} />
                <StatCard title="Pending/Processing" value={stats.pending} icon={<Clock3 size={24} className="text-apple-orange" />} />
                <StatCard title="Ready for Pickup" value={stats.ready} icon={<CheckCircle2 size={24} className="text-apple-green" />} />
                <StatCard title="Overdue Orders" value={stats.overdue} icon={<AlertTriangle size={24} className="text-apple-red" />} colorClass={stats.overdue > 0 ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700' : ''}/>
            </div>

            <Card title="Manage Orders" className="overflow-visible" contentClassName="p-0 sm:p-0">
                 <FilterControls
                    filters={filters} // Only pass necessary parts of filters state if not all are used by FilterControls
                    onFilterChange={handleFilterChange}
                    onResetFilters={handleResetFilters}
                    onApplyFilters={loadOrders}
                />
                <div className="px-4 sm:px-6 pb-6"> {/* Add padding around table */}
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <Spinner size="lg" />
                        </div>
                    ) : error ? (
                        <div className="p-4 text-center text-apple-red bg-red-50 dark:bg-red-900/30 rounded-apple">
                            <AlertTriangle size={24} className="mx-auto mb-2" />
                            {error}
                        </div>
                    ) : (
                        <>
                            <OrderTable orders={orders} />
                            {pagination.totalPages > 1 && (
                                <div className="mt-6 flex justify-between items-center">
                                    <span className="text-sm text-apple-gray-600 dark:text-apple-gray-400">
                                        Page {pagination.currentPage} of {pagination.totalPages} (Total: {pagination.totalOrders} orders)
                                    </span>
                                    <div className="space-x-2">
                                        <Button
                                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                                            disabled={pagination.currentPage === 1}
                                            variant="secondary"
                                            size="sm"
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                                            disabled={pagination.currentPage === pagination.totalPages}
                                            variant="secondary"
                                            size="sm"
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default DashboardPage;