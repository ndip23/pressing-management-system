// client/src/pages/Customers/CustomerDetailsPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchCustomerById, fetchOrders } from '../../services/api';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Spinner from '../../components/UI/Spinner';
import OrderTable from '../../components/Dashboard/OrderTable'; // Reusing OrderTable
import { User, ArrowLeft, Edit3, Mail, Phone, MapPin, AlertTriangle } from 'lucide-react'; // Removed ListOrdered as OrderTable handles it

// DetailItem Component (can be moved to a common UI folder if used elsewhere)
const DetailItem = ({ label, value, className = "", children }) => (
    <div className={`py-3 sm:grid sm:grid-cols-3 sm:gap-4 border-b border-apple-gray-100 dark:border-apple-gray-800 px-4 sm:px-6 last:border-b-0 ${className}`}> {/* Added padding here */}
        <dt className="text-sm font-medium text-apple-gray-500 dark:text-apple-gray-400">{label}</dt>
        <dd className="mt-1 text-sm text-apple-gray-900 dark:text-apple-gray-100 sm:mt-0 sm:col-span-2">
            {children || value || <span className="italic text-apple-gray-400 dark:text-apple-gray-500">N/A</span>}
        </dd>
    </div>
);

const CustomerDetailsPage = () => {
    const { id: customerId } = useParams();
    const navigate = useNavigate();

    const [customer, setCustomer] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loadingCustomer, setLoadingCustomer] = useState(true);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [error, setError] = useState('');

    const loadCustomerDetails = useCallback(async () => {
        setLoadingCustomer(true);
        setError(''); // Clear previous errors
        try {
            const { data } = await fetchCustomerById(customerId);
            setCustomer(data);
        } catch (err) {
            setError(err.response?.status === 404 ? 'Customer not found.' : (err.response?.data?.message || 'Failed to fetch customer details.'));
            console.error("Fetch Customer Details Error:", err);
        } finally {
            setLoadingCustomer(false);
        }
    }, [customerId]);

    const loadCustomerOrders = useCallback(async () => {
        if (!customerId) return;
        setLoadingOrders(true);
        try {
            const { data } = await fetchOrders({ customerId: customerId, pageSize: 100 }); // Fetch up to 100 orders for this customer
            setOrders(data.orders || []);
        } catch (err) {
            console.error("Fetch Customer Orders Error:", err);
            // Optionally set a specific error for the orders list if needed
            // setOrdersError("Failed to load order history.");
        } finally {
            setLoadingOrders(false);
        }
    }, [customerId]);

    useEffect(() => {
        loadCustomerDetails();
        loadCustomerOrders();
    }, [loadCustomerDetails, loadCustomerOrders]); // These callbacks are stable due to their own dependency arrays

    if (loadingCustomer && !customer && !error) { // Show main loader only if no error yet and customer not loaded
        return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
    }

    if (error && !customer) { // If fetching customer failed and customer is still null
        return (
            <div className="text-center py-10 max-w-xl mx-auto">
                <Card>
                    <AlertTriangle size={48} className="mx-auto text-apple-red mb-4" />
                    <p className="text-xl text-apple-red">{error}</p>
                    <Button onClick={() => navigate('/customers')} variant="secondary" className="mt-6">Back to Customers List</Button>
                </Card>
            </div>
        );
    }

    if (!customer) { // Fallback if still no customer data after loading attempts (and no major error shown)
        return <div className="text-center p-6 text-apple-gray-500">Customer data could not be loaded.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center space-x-3">
                    <Link to="/customers" className="p-1.5 rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800" aria-label="Back to Customers List">
                        <ArrowLeft size={22} className="text-apple-gray-600 dark:text-apple-gray-400" />
                    </Link>
                    <User size={28} className="text-apple-blue" />
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-semibold text-apple-gray-800 dark:text-apple-gray-100">{customer.name}</h1>
                        <p className="text-sm text-apple-gray-500 dark:text-apple-gray-400">Customer Profile & Order History</p>
                    </div>
                </div>
                <Link to={`/customers/${customer._id}/edit`}>
                    <Button variant="primary" iconLeft={<Edit3 size={16} />}>
                        Edit Customer
                    </Button>
                </Link>
            </div>

            <Card title="Contact Information" contentClassName="p-0"> {/* No internal padding for Card if DetailItem has it */}
                <dl className="divide-y divide-apple-gray-100 dark:divide-apple-gray-800">
                    <DetailItem label="Full Name" value={customer.name} />
                    <DetailItem label="Phone Number">
                        <div className="flex items-center">
                            <Phone size={14} className="mr-2 text-apple-gray-400" />
                            {customer.phone ? <a href={`tel:${customer.phone}`} className="text-apple-blue hover:underline">{customer.phone}</a> : <span className="italic text-apple-gray-400">N/A</span>}
                        </div>
                    </DetailItem>
                    <DetailItem label="Email Address">
                        {customer.email ? (
                            <div className="flex items-center">
                                <Mail size={14} className="mr-2 text-apple-gray-400" />
                                <a href={`mailto:${customer.email}`} className="text-apple-blue hover:underline">{customer.email}</a>
                            </div>
                        ) : (<span className="italic text-apple-gray-400">N/A</span>)}
                    </DetailItem>
                    <DetailItem label="Address">
                        {customer.address ? (
                             <div className="flex items-start"> {/* items-start for multi-line address */}
                                <MapPin size={14} className="mr-2 mt-0.5 text-apple-gray-400 flex-shrink-0" />
                                <span className="whitespace-pre-line">{customer.address}</span>
                            </div>
                        ) : (<span className="italic text-apple-gray-400">N/A</span>)}
                    </DetailItem>
                </dl>
            </Card>

            <Card title="Order History" contentClassName="p-0"> {/* No Card padding to allow table full width */}
                {loadingOrders ? (
                    <div className="p-6 text-center"><Spinner /></div>
                ) : orders.length === 0 ? (
                    <p className="p-6 text-center text-sm text-apple-gray-500 dark:text-apple-gray-400">This customer has no orders recorded.</p>
                ) : (
                    // The OrderTable component might have its own internal padding.
                    // If not, you might want a div wrapper here with padding e.g. <div className="p-4">
                    <OrderTable orders={orders} />
                )}
            </Card>
        </div>
    );
};

export default CustomerDetailsPage;