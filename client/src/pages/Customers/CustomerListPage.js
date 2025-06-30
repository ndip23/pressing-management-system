// client/src/pages/Customers/CustomerListPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchCustomers, deleteCustomerApi } from '../../services/api';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Spinner from '../../components/UI/Spinner';
import { Users, PlusCircle, Search, Edit3, Trash2, Eye, AlertTriangle, CheckCircle2 } from 'lucide-react';

const CustomerListPage = () => {
    // --- State Management ---
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionError, setActionError] = useState('');
    const [actionSuccess, setActionSuccess] = useState('');

    // State for search and pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalCustomers: 0,
    });

    // --- Data Fetching ---
    const loadCustomers = useCallback(async (search, page) => {
        setLoading(true);
        setError('');
        try {
            const filters = { search: search, page: page, pageSize: 10 }; // Hardcoded page size
            const { data } = await fetchCustomers(filters);

            if (data && Array.isArray(data.customers)) {
                setCustomers(data.customers);
                setPagination({
                    currentPage: data.page || 1,
                    totalPages: data.pages || 1,
                    totalCustomers: data.totalCustomers || 0,
                });
            } else {
                console.warn("CustomerListPage: Unexpected data structure from API. Expected { customers: [], ... }", data);
                setCustomers([]);
                setPagination({ currentPage: 1, totalPages: 1, totalCustomers: 0 });
            }
        } catch (err) {
            const errMsg = err.response?.data?.message || err.message || 'Failed to fetch customers.';
            setError(errMsg);
            console.error("CustomerListPage: Fetch Customers Error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Debouncing effect for search input
    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500); // Wait 500ms after user stops typing
        return () => clearTimeout(timerId);
    }, [searchTerm]);

    // Effect to fetch data when debounced search term or current page changes
    useEffect(() => {
        loadCustomers(debouncedSearchTerm, pagination.currentPage);
    }, [debouncedSearchTerm, pagination.currentPage, loadCustomers]);


    // --- Action Handlers ---
    useEffect(() => {
        let timer;
        if (actionError || actionSuccess) {
            timer = setTimeout(() => {
                setActionError('');
                setActionSuccess('');
            }, 4000);
        }
        return () => clearTimeout(timer);
    }, [actionError, actionSuccess]);

    const handleDeleteCustomer = async (customerId, customerName) => {
        if (window.confirm(`Are you sure you want to delete customer "${customerName}"? This may be restricted if they have existing orders.`)) {
            setActionError(''); setActionSuccess('');
            try {
                await deleteCustomerApi(customerId);
                setActionSuccess(`Customer "${customerName}" deleted successfully.`);
                // If on the last page with only one item, go back a page
                if (customers.length === 1 && pagination.currentPage > 1) {
                    handlePageChange(pagination.currentPage - 1);
                } else {
                    loadCustomers(debouncedSearchTerm, pagination.currentPage); // Refresh current page
                }
            } catch (err) {
                setActionError(err.response?.data?.message || `Failed to delete customer "${customerName}".`);
            }
        }
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page on new search
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages && newPage !== pagination.currentPage && !loading) {
            setPagination(prev => ({ ...prev, currentPage: newPage }));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center space-x-3">
                    <Users size={28} className="text-apple-blue" />
                    <h1 className="text-2xl sm:text-3xl font-semibold text-apple-gray-800 dark:text-apple-gray-100">Manage Customers</h1>
                </div>
                <Link to="/customers/new"><Button variant="primary" iconLeft={<PlusCircle size={18} />}>Add New Customer</Button></Link>
            </div>

            <Card>
                <div className="p-4 border-b border-apple-gray-200 dark:border-apple-gray-700">
                    <Input id="customerSearch" placeholder="Search by name, phone, or email..." value={searchTerm} onChange={handleSearchChange} prefixIcon={<Search size={16} />} className="mb-0" />
                </div>

                {actionSuccess && ( <div className="p-3 m-4 text-sm bg-green-100 text-apple-green rounded-apple flex items-center"><CheckCircle2 size={18} className="mr-2"/>{actionSuccess}</div> )}
                {actionError && ( <div className="p-3 m-4 text-sm bg-red-100 text-apple-red rounded-apple flex items-center"><AlertTriangle size={18} className="mr-2"/>{actionError}</div> )}

                <div className="overflow-x-auto">
                    {loading && customers.length === 0 ? (
                        <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>
                    ) : error ? (
                        <div className="p-4 text-center text-apple-red bg-red-50 dark:bg-red-900/30 rounded-apple">
                            <AlertTriangle size={24} className="mx-auto mb-2" /> {error}
                            <Button onClick={() => loadCustomers(searchTerm, pagination.currentPage)} variant="secondary" className="mt-3 ml-2" isLoading={loading}>Try Again</Button>
                        </div>
                    ) : customers.length === 0 ? (
                        <div className="p-6 text-center text-apple-gray-500 dark:text-apple-gray-400">
                            {searchTerm ? `No customers found matching "${searchTerm}".` : "No customers have been added yet."}
                            {!searchTerm && <p className="mt-2"><Link to="/customers/new" className="text-apple-blue hover:underline">Add the first customer!</Link></p>}
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-apple-gray-200 dark:divide-apple-gray-700">
                            <thead className="bg-apple-gray-50 dark:bg-apple-gray-800/50">
                                <tr>
                                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wider">Name</th>
                                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wider">Phone</th>
                                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wider">Email</th>
                                    <th className="px-4 py-3.5 text-center text-xs font-semibold text-apple-gray-500 dark:text-apple-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-apple-gray-200 dark:divide-apple-gray-700 bg-white dark:bg-apple-gray-900">
                                {customers.map(customer => (
                                    <tr key={customer._id} className="hover:bg-apple-gray-50/70 dark:hover:bg-apple-gray-800/70 transition-colors duration-150">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-apple-gray-800 dark:text-apple-gray-100">{customer.name}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-apple-gray-600 dark:text-apple-gray-300">{customer.phone}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-apple-gray-600 dark:text-apple-gray-300">{customer.email || <span className="italic text-apple-gray-400 dark:text-apple-gray-500">N/A</span>}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                                            <div className="flex items-center justify-center space-x-2">
                                                <Link to={`/customers/${customer._id}/details`} className="p-1.5 rounded-full hover:bg-apple-gray-200 dark:hover:bg-apple-gray-700" title="View Details">
                                                    <Eye size={18} className="text-apple-gray-500 hover:text-apple-blue dark:text-apple-gray-400 dark:hover:text-apple-blue-light" />
                                                </Link>
                                                <Link to={`/customers/${customer._id}/edit`} className="p-1.5 rounded-full hover:bg-apple-gray-200 dark:hover:bg-apple-gray-700" title="Edit Customer">
                                                    <Edit3 size={18} className="text-apple-gray-500 hover:text-apple-orange dark:text-apple-gray-400 dark:hover:text-orange-400" />
                                                </Link>
                                                <Button variant="ghost" size="sm" onClick={() => handleDeleteCustomer(customer._id, customer.name)} className="p-1.5 text-apple-gray-500 hover:text-apple-red dark:text-apple-gray-400 dark:hover:text-red-400" title="Delete Customer">
                                                    <Trash2 size={18} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                {/* Pagination Controls */}
                {!loading && !error && pagination.totalPages > 1 && (
                    <div className="p-4 border-t border-apple-gray-200 dark:border-apple-gray-700 flex flex-col sm:flex-row justify-between items-center gap-2">
                        <span className="text-sm text-apple-gray-600 dark:text-apple-gray-400">
                            Page {pagination.currentPage} of {pagination.totalPages} (Total: {pagination.totalCustomers} customers)
                        </span>
                        <div className="flex space-x-2">
                            <Button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1 || loading} variant="secondary" size="sm">Previous</Button>
                            <Button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage >= pagination.totalPages || loading} variant="secondary" size="sm">Next</Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default CustomerListPage;