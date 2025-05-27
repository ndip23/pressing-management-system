// client/src/pages/Orders/EditOrderPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import CreateOrderForm from '../../components/Orders/CreateOrderForm';
import Card from '../../components/UI/Card';
import Spinner from '../../components/UI/Spinner';
import { fetchOrderById } from '../../services/api';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import Button from '../../components/UI/Button';

const EditOrderPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [initialOrderData, setInitialOrderData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadOrder = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await fetchOrderById(id);
            // The CreateOrderForm useEffect will handle transforming this data
            setInitialOrderData(data);
        } catch (err) {
            setError(err.response?.status === 404 ? 'Order not found.' : (err.response?.data?.message || 'Failed to fetch order for editing.'));
            console.error("Fetch Order for Edit Error:", err.response || err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadOrder();
    }, [loadOrder]);


    if (loading) return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
    if (error) return (
        <div className="text-center py-10">
            <AlertTriangle size={48} className="mx-auto text-apple-red mb-4" />
            <p className="text-xl text-apple-red">{error}</p>
            <Button onClick={() => navigate(-1)} variant="secondary" className="mt-4">Go Back</Button>
        </div>
    );
    if (!initialOrderData) return <p className="text-center p-4">Order data could not be loaded.</p>; // Fallback if data is null post-loading

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center space-x-2">
                     <Link to={`/orders/${id}`} className="text-apple-gray-500 hover:text-apple-blue p-1.5 rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-semibold text-apple-gray-800 dark:text-apple-gray-100">
                        Edit Order <span className="text-lg text-apple-gray-500 dark:text-apple-gray-400">#{initialOrderData.receiptNumber}</span>
                    </h1>
                </div>
            </div>
            <Card contentClassName="p-4 sm:p-6 md:p-8">
                {/* Pass the fetched initialOrderData to the form */}
                <CreateOrderForm initialOrderData={initialOrderData} isEditMode={true} />
            </Card>
        </div>
    );
};

export default EditOrderPage;