import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PlusCircle, AlertTriangle, Filter as FilterIcon } from 'lucide-react';
import { fetchOrders } from '../../services/api';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Spinner from '../../components/UI/Spinner';
import OrderTable from '../../components/Dashboard/OrderTable';
import FilterControls from '../../components/Dashboard/FilterControls';
import { trackEvent } from '../../utils/pixel';

const TAB_KEYS = ['active', 'all', 'pending', 'processing', 'ready', 'completed', 'overdue'];

const tabToFilters = (tab, baseFilters) => {
    const next = {
        ...baseFilters,
        status: '',
        overdue: '',
        active: '',
        page: 1,
    };

    switch (tab) {
        case 'active':
            next.active = 'true';
            break;
        case 'pending':
            next.status = 'Pending';
            break;
        case 'processing':
            next.status = 'Processing';
            break;
        case 'ready':
            next.status = 'Ready for Pickup';
            break;
        case 'completed':
            next.status = 'Completed';
            break;
        case 'overdue':
            next.overdue = 'true';
            break;
        default:
            break;
    }

    return next;
};

const OrdersListPage = () => {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = TAB_KEYS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'active';

    const [activeTab, setActiveTab] = useState(initialTab);
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [ordersError, setOrdersError] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        paid: '',
        overdue: '',
        active: 'true',
        customerName: '',
        status: '',
        receiptNumber: '',
        customerPhone: '',
        page: 1,
        pageSize: 15,
    });
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalOrders: 0 });

    const loadOrders = useCallback(async () => {
        setLoadingOrders(true);
        setOrdersError('');
        try {
            const { data } = await fetchOrders(filters);
            setOrders(Array.isArray(data?.orders) ? data.orders : []);
            setPagination({
                currentPage: data.page || 1,
                totalPages: data.pages || 0,
                totalOrders: data.totalOrders || 0,
            });
        } catch (err) {
            setOrdersError(err.response?.data?.message || t('ordersList.loadError'));
            setOrders([]);
            setPagination({ currentPage: 1, totalPages: 0, totalOrders: 0 });
        } finally {
            setLoadingOrders(false);
        }
    }, [filters, t]);

    useEffect(() => {
        loadOrders();
        trackEvent('ViewContent', { content_name: 'Orders List', content_category: 'Management' });
    }, [loadOrders]);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && TAB_KEYS.includes(tab) && tab !== activeTab) {
            setActiveTab(tab);
            setFilters((prev) => tabToFilters(tab, prev));
        }
    }, [searchParams, activeTab]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setSearchParams(tab === 'active' ? {} : { tab });
        setFilters((prev) => tabToFilters(tab, prev));
    };

    const handleFilterChange = (newFilters) => {
        setActiveTab('all');
        setSearchParams({});
        setFilters((prev) => ({ ...prev, ...newFilters, active: '', page: 1 }));
    };

    const handleResetFilters = () => {
        setActiveTab('active');
        setSearchParams({});
        setFilters({
            paid: '',
            overdue: '',
            active: 'true',
            customerName: '',
            status: '',
            receiptNumber: '',
            customerPhone: '',
            page: 1,
            pageSize: 15,
        });
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages && newPage !== pagination.currentPage && !loadingOrders) {
            setFilters((prev) => ({ ...prev, page: newPage }));
        }
    };

    let ordersContent;
    if (loadingOrders && orders.length === 0 && !ordersError) {
        ordersContent = (
            <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
            </div>
        );
    } else if (ordersError) {
        ordersContent = (
            <div className="p-4 text-center text-apple-red bg-red-50 dark:bg-red-900/30 rounded-apple">
                <AlertTriangle size={24} className="mx-auto mb-2" />
                {ordersError}
            </div>
        );
    } else if (!loadingOrders && orders.length === 0) {
        ordersContent = (
            <div className="py-10 text-center text-apple-gray-500 dark:text-apple-gray-400">
                <p>{t('ordersList.empty')}</p>
                <Link to="/app/orders/new" className="inline-block mt-4">
                    <Button variant="primary" size="md" iconLeft={<PlusCircle size={18} />}>
                        {t('ordersList.createFirst')}
                    </Button>
                </Link>
            </div>
        );
    } else {
        ordersContent = (
            <>
                {loadingOrders && orders.length > 0 && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-black/50 flex items-center justify-center z-10 rounded-b-apple-lg">
                        <Spinner />
                    </div>
                )}
                <OrderTable orders={orders} />
                {pagination.totalOrders > 0 && pagination.totalPages > 1 && (
                    <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-2">
                        <span className="text-sm text-apple-gray-600 dark:text-apple-gray-400">
                            {t('dashboard.pageInfo', {
                                currentPage: pagination.currentPage,
                                totalPages: pagination.totalPages,
                                totalOrders: pagination.totalOrders,
                            })}
                        </span>
                        <div className="flex space-x-2">
                            <Button
                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                                disabled={pagination.currentPage === 1 || loadingOrders}
                                variant="secondary"
                                size="sm"
                            >
                                {t('dashboard.previous')}
                            </Button>
                            <Button
                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                disabled={pagination.currentPage >= pagination.totalPages || loadingOrders}
                                variant="secondary"
                                size="sm"
                            >
                                {t('dashboard.next')}
                            </Button>
                        </div>
                    </div>
                )}
            </>
        );
    }

    const tabs = [
        { key: 'active', label: t('ordersList.tabs.active') },
        { key: 'pending', label: t('ordersList.tabs.pending') },
        { key: 'processing', label: t('ordersList.tabs.processing') },
        { key: 'ready', label: t('ordersList.tabs.ready') },
        { key: 'completed', label: t('ordersList.tabs.completed') },
        { key: 'overdue', label: t('ordersList.tabs.overdue') },
        { key: 'all', label: t('ordersList.tabs.all') },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-semibold text-apple-gray-800 dark:text-apple-gray-100">
                        {t('ordersList.title')}
                    </h1>
                    <p className="mt-1 text-sm text-apple-gray-600 dark:text-apple-gray-400">
                        {t('ordersList.subtitle')}
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        onClick={() => setShowFilters((prev) => !prev)}
                        variant="secondary"
                        size="md"
                        iconLeft={<FilterIcon size={16} />}
                    >
                        {t('dashboard.filters')}{' '}
                        {showFilters ? t('dashboard.filtersHide') : t('dashboard.filtersShow')}
                    </Button>
                    <Link to="/app/orders/new">
                        <Button variant="primary" size="md" iconLeft={<PlusCircle size={18} />}>
                            {t('dashboard.createNewOrder')}
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => handleTabChange(tab.key)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            activeTab === tab.key
                                ? 'bg-apple-blue text-white shadow-apple-sm'
                                : 'bg-apple-gray-100 dark:bg-apple-gray-800 text-apple-gray-700 dark:text-apple-gray-300 hover:bg-apple-gray-200 dark:hover:bg-apple-gray-700'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {!loadingOrders && pagination.totalOrders > 0 && (
                <p className="text-sm text-apple-gray-600 dark:text-apple-gray-400">
                    {t('ordersList.showing', { count: pagination.totalOrders })}
                </p>
            )}

            {showFilters && (
                <Card title={t('dashboard.filterOrders')} className="mb-2">
                    <FilterControls
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onResetFilters={handleResetFilters}
                        onApplyFilters={loadOrders}
                    />
                </Card>
            )}

            <Card
                title={t('ordersList.tableTitle')}
                className="overflow-visible relative"
                contentClassName="p-0 sm:p-0"
            >
                <div className="px-4 sm:px-6 pb-6 relative">{ordersContent}</div>
            </Card>
        </div>
    );
};

export default OrdersListPage;
