// client/src/pages/Customers/CustomerListPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchCustomers, deleteCustomerApi } from '../../services/api';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Spinner from '../../components/UI/Spinner';
import { Users, PlusCircle, Search, Edit3, Trash2, Eye, AlertTriangle, CheckCircle2 } from 'lucide-react'; // Added CheckCircle2 for success

const CustomerListPage = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [deleteSuccess, setDeleteSuccess] = useState('');

    const loadCustomers = useCallback(async () => {
        setLoading(true); setError('');
        setDeleteError(''); setDeleteSuccess(''); // Clear action messages on reload
        try {
            const { data } = await fetchCustomers(searchTerm);
            setCustomers(data || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch customers.');
        } finally {
            setLoading(false);
        }
    }, [searchTerm]);

    useEffect(() => {
        loadCustomers();
    }, [loadCustomers]);

    useEffect(() => { // To clear delete messages after a while
        let timer;
        if (deleteError || deleteSuccess) {
            timer = setTimeout(() => {
                setDeleteError('');
                setDeleteSuccess('');
            }, 4000);
        }
        return () => clearTimeout(timer);
    }, [deleteError, deleteSuccess]);

    const handleDeleteCustomer = async (customerId, customerName) => {
        if (window.confirm(`Are you sure you want to delete customer "${customerName}"? This may be restricted if they have existing orders.`)) {
            setDeleteError(''); setDeleteSuccess('');
            try {
                await deleteCustomerApi(customerId);
                setDeleteSuccess(`Customer "${customerName}" deleted successfully.`);
                loadCustomers(); // Refresh
            } catch (err) {
                setDeleteError(err.response?.data?.message || `Failed to delete "${customerName}".`);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center space-x-3">
                    <Users size={28} className="text-apple-blue" />
                    <h1 className="text-2xl sm:text-3xl font-semibold">Manage Customers</h1>
                </div>
                <Link to="/customers/new"><Button variant="primary" iconLeft={<PlusCircle size={18} />}>Add New Customer</Button></Link>
            </div>

            <Card>
                <div className="p-4 border-b dark:border-apple-gray-700">
                    <Input id="customerSearch" placeholder="Search by name, phone, or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} prefixIcon={<Search size={16} />} className="mb-0" />
                </div>

                {deleteSuccess && <div className="p-3 m-4 text-sm bg-green-100 text-apple-green rounded-apple flex items-center"><CheckCircle2 size={18} className="mr-2"/>{deleteSuccess}</div>}
                {deleteError && <div className="p-3 m-4 text-sm bg-red-100 text-apple-red rounded-apple flex items-center"><AlertTriangle size={18} className="mr-2"/>{deleteError}</div>}

                {loading ? ( <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>
                ) : error ? ( <div className="p-4 text-center text-apple-red">{error}</div>
                ) : customers.length === 0 ? ( <div className="p-6 text-center text-apple-gray-500 dark:text-apple-gray-400">No customers found.{searchTerm && " Try adjusting your search."}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-apple-gray-200 dark:divide-apple-gray-700">
                            <thead className="bg-apple-gray-50 dark:bg-apple-gray-800/50">
                                <tr>
                                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Name</th>
                                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Phone</th>
                                    <th className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider">Email</th>
                                    <th className="px-4 py-3.5 text-center text-xs font-semibold uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-apple-gray-200 dark:divide-apple-gray-700 bg-white dark:bg-apple-gray-900">
                                {customers.map(customer => (
                                    <tr key={customer._id} className="hover:bg-apple-gray-50/70 dark:hover:bg-apple-gray-800/70">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{customer.name}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm">{customer.phone}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm">{customer.email || <span className="italic text-apple-gray-400">N/A</span>}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                                            <div className="flex items-center justify-center space-x-2">
                                                {/* CORRECTED LINK TO CUSTOMER DETAILS */}
                                                <Link to={`/customers/${customer._id}/details`} className="p-1 rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-700" title="View Details">
                                                    <Eye size={18} className="text-apple-gray-500 hover:text-apple-blue dark:text-apple-gray-400 dark:hover:text-apple-blue-light" />
                                                </Link>
                                                <Link to={`/customers/${customer._id}/edit`} className="p-1 rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-700" title="Edit Customer">
                                                    <Edit3 size={18} className="text-apple-gray-500 hover:text-apple-orange dark:text-apple-gray-400 dark:hover:text-orange-400" />
                                                </Link>
                                                <Button variant="ghost" size="sm" onClick={() => handleDeleteCustomer(customer._id, customer.name)} className="p-1 text-apple-gray-500 hover:text-apple-red dark:text-apple-gray-400 dark:hover:text-red-400" title="Delete Customer">
                                                    <Trash2 size={18} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default CustomerListPage;