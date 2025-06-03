// client/src/pages/Customers/CustomerFormPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
    fetchCustomerById,
    createNewCustomer,
    updateExistingCustomer
} from '../../services/api';
import Card from '../../components/UI/Card';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';
import Spinner from '../../components/UI/Spinner';
import { UserPlus, Edit3, Save, ArrowLeft, AlertTriangle, CheckCircle2 } from 'lucide-react';

const CustomerFormPage = ({ mode }) => { // mode will be 'create' or 'edit'
    const { id } = useParams(); // For edit mode
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
    });
    const [loading, setLoading] = useState(false); // For fetching data in edit mode
    const [saving, setSaving] = useState(false);   // For submitting form
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const isEditMode = mode === 'edit';

    // Fetch customer data if in edit mode
    useEffect(() => {
        if (isEditMode && id) {
            const loadCustomer = async () => {
                setLoading(true);
                setError('');
                try {
                    const { data } = await fetchCustomerById(id);
                    setFormData({
                        name: data.name || '',
                        phone: data.phone || '',
                        email: data.email || '',
                        address: data.address || '',
                    });
                } catch (err) {
                    setError(err.response?.data?.message || `Failed to fetch customer data for ID: ${id}.`);
                    console.error("Fetch Customer Error (Edit):", err);
                } finally {
                    setLoading(false);
                }
            };
            loadCustomer();
        } else if (!isEditMode) {
            // Reset form for create mode if navigating back from edit or similar
            setFormData({ name: '', phone: '', email: '', address: '' });
        }
    }, [isEditMode, id]); // Only re-run if mode or id changes

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        if (!formData.name || !formData.phone) {
            setError('Customer name and phone number are required.');
            setSaving(false);
            return;
        }

        try {
            if (isEditMode) {
                const { data: updatedCustomer } = await updateExistingCustomer(id, formData);
                setSuccess(`Customer "${updatedCustomer.name}" updated successfully!`);
            } else {
                const { data: newCustomer } = await createNewCustomer(formData);
                setSuccess(`Customer "${newCustomer.name}" created successfully!`);
                // Optionally navigate to customer list or details after creation
                setTimeout(() => navigate('/customers'), 1500); // Redirect after a short delay
            }
        } catch (err) {
            setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} customer.`);
            console.error("Customer Form Submit Error:", err);
        } finally {
            setSaving(false);
            if (!isEditMode && !error) { // Clear form only on successful creation
                 // setFormData({ name: '', phone: '', email: '', address: '' }); // Or let redirect handle it
            }
            setTimeout(() => { setSuccess(''); setError(''); }, 4000);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>;
    }

    // If in edit mode and there was an error fetching the customer (and formData is still default)
    if (isEditMode && error && !formData.name) {
        return (
            <div className="text-center py-10 max-w-xl mx-auto">
                <Card>
                    <AlertTriangle size={48} className="mx-auto text-apple-red mb-4" />
                    <p className="text-xl text-apple-red">{error}</p>
                    <Link to="/customers">
                        <Button variant="secondary" className="mt-6">Back to Customers</Button>
                    </Link>
                </Card>
            </div>
        );
    }


    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center space-x-3 mb-6">
                <Link to="/customers" className="p-1.5 rounded-full hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800">
                    <ArrowLeft size={22} className="text-apple-gray-600 dark:text-apple-gray-400" />
                </Link>
                {isEditMode ? <Edit3 size={28} className="text-apple-blue" /> : <UserPlus size={28} className="text-apple-blue" />}
                <h1 className="text-2xl sm:text-3xl font-semibold">
                    {isEditMode ? 'Edit Customer' : 'Add New Customer'}
                </h1>
            </div>

            {success && (
                <div className="p-3 mb-4 bg-green-100 text-apple-green rounded-apple border border-green-300 dark:border-green-700 dark:text-green-300 dark:bg-green-900/30">
                    <div className="flex items-center"><CheckCircle2 size={20} className="mr-2"/>{success}</div>
                </div>
            )}
            {error && (
                 <div className="p-3 mb-4 bg-red-100 text-apple-red rounded-apple border border-red-300 dark:border-red-700 dark:text-red-300 dark:bg-red-900/30">
                    <div className="flex items-center"><AlertTriangle size={20} className="mr-2"/>{error}</div>
                </div>
            )}

            <Card>
                <form onSubmit={handleSubmit} className="space-y-6 p-2 sm:p-0"> {/* No Card padding if form has its own */}
                    <Input
                        label="Full Name"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Enter customer's full name"
                    />
                    <Input
                        label="Phone Number"
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        placeholder="e.g., 555-123-4567"
                    />
                    <Input
                        label="Email Address (Optional)"
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="customer@example.com"
                    />
                    <Input
                        label="Address (Optional)"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="123 Main St, City, State"
                    />
                    <div className="flex justify-end space-x-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => navigate('/customers')} disabled={saving}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" isLoading={saving} iconLeft={<Save size={16} />}>
                            {isEditMode ? 'Save Changes' : 'Create Customer'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default CustomerFormPage;