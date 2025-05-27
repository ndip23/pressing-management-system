// client/src/components/Orders/CreateOrderForm.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../UI/Input';
import Select from '../UI/Select';
import Button from '../UI/Button';
import DatePicker from '../UI/DatePicker';
import OrderItemRow from './OrderItemRow';
import { createNewOrder, updateExistingOrder, fetchCustomers, fetchCustomerById } from '../../services/api';
import { Plus, Save, UserPlus, Search, UserCheck, RefreshCw } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Spinner from '../UI/Spinner';

const MOCK_ITEM_TYPES = ['Shirt', 'Trousers', 'Suit', 'Dress', 'Blouse', 'Jacket', 'Bedding', 'Scarf', 'Tie', 'Coat', 'Other'];
const MOCK_SERVICE_TYPES = [
    { value: 'wash', label: 'Wash' },
    { value: 'dry clean', label: 'Dry Clean' },
    { value: 'iron', label: 'Iron Only' },
    { value: 'wash & iron', label: 'Wash & Iron' },
    { value: 'special care', label: 'Special Care' },
];

const CreateOrderForm = ({ initialOrderData, isEditMode = false }) => {
    const navigate = useNavigate();

    // Customer State
    const [customerInput, setCustomerInput] = useState({ name: '', phone: '', email: '', address: '' });
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [customerSearchQuery, setCustomerSearchQuery] = useState('');
    const [searchedCustomers, setSearchedCustomers] = useState([]);
    const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
    const [customerSelectionMode, setCustomerSelectionMode] = useState('new'); // 'new' or 'existing'

    // Order Items State
    const [items, setItems] = useState([{ id: Date.now(), itemType: '', serviceType: 'wash', quantity: 1, specialInstructions: '' }]);

    // Order Details State
    const [expectedPickupDate, setExpectedPickupDate] = useState(
        format(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
    );
    const [totalAmount, setTotalAmount] = useState(0);
    const [amountPaid, setAmountPaid] = useState(0);
    const [notes, setNotes] = useState('');

    // UI State
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Pre-fill form if in edit mode or if initialOrderData (e.g., customer pre-selected)
    useEffect(() => {
        if (initialOrderData) {
            if (initialOrderData.customer) { // If full customer object is there
                setCustomerInput({
                    name: initialOrderData.customer.name || '',
                    phone: initialOrderData.customer.phone || '',
                    email: initialOrderData.customer.email || '',
                    address: initialOrderData.customer.address || '',
                });
                setSelectedCustomerId(initialOrderData.customer._id);
                setCustomerSelectionMode('existing'); // Assume existing if customer ID present
            } else if (initialOrderData.customerIdFromQuery) { // If only ID passed, fetch customer
                const loadCustomer = async () => {
                    try {
                        const { data: cust } = await fetchCustomerById(initialOrderData.customerIdFromQuery);
                        setCustomerInput({ name: cust.name, phone: cust.phone, email: cust.email || '', address: cust.address || '' });
                        setSelectedCustomerId(cust._id);
                        setCustomerSelectionMode('existing');
                    } catch (err) { console.error("Failed to load customer for order:", err); }
                };
                loadCustomer();
            }

            setItems(initialOrderData.items?.map(item => ({ ...item, id: item._id || Date.now() + Math.random() })) || [{ id: Date.now(), itemType: '', serviceType: 'wash', quantity: 1, specialInstructions: '' }]);
            setExpectedPickupDate(initialOrderData.expectedPickupDate ? format(parseISO(initialOrderData.expectedPickupDate), 'yyyy-MM-dd') : format(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
            setTotalAmount(initialOrderData.totalAmount || 0);
            setAmountPaid(initialOrderData.amountPaid || 0);
            setNotes(initialOrderData.notes || '');
        }
    }, [initialOrderData]);


    const handleCustomerInputChange = (e) => {
        setCustomerInput({ ...customerInput, [e.target.name]: e.target.value });
        if (selectedCustomerId && customerSelectionMode === 'existing') {
            // If editing an existing selected customer's details, mark for potential update
        }
    };

    const handleCustomerSearchChange = async (e) => {
        const query = e.target.value;
        setCustomerSearchQuery(query);
        if (query.length > 1) {
            setIsSearchingCustomers(true);
            try {
                const { data } = await fetchCustomers(query);
                setSearchedCustomers(data || []);
            } catch (err) {
                console.error("Customer search error:", err);
                setSearchedCustomers([]);
            } finally {
                setIsSearchingCustomers(false);
            }
        } else {
            setSearchedCustomers([]);
        }
    };

    const handleSelectCustomer = (customer) => {
        setCustomerInput({ name: customer.name, phone: customer.phone, email: customer.email || '', address: customer.address || '' });
        setSelectedCustomerId(customer._id);
        setCustomerSearchQuery('');
        setSearchedCustomers([]);
        setCustomerSelectionMode('existing'); // Explicitly set to existing
    };

    const handleCreateNewCustomerToggle = () => {
        setCustomerSelectionMode('new');
        setSelectedCustomerId(null); // Clear selected ID if switching to new
        // Optionally clear customerInput fields or keep them if user was typing then decided to create new
        // setCustomerInput({ name: '', phone: '', email: '', address: '' });
    };

    const handleItemChange = (id, field, value) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };
    const handleAddItem = () => setItems([...items, { id: Date.now(), itemType: '', serviceType: 'wash', quantity: 1, specialInstructions: '' }]);
    const handleRemoveItem = (id) => setItems(items.filter(item => item.id !== id));

    // Placeholder for pricing logic - replace with your actual pricing rules
    const calculateItemPrice = useCallback((item) => {
        let price = 0;
        if (item.serviceType === 'dry clean') price = 8;
        else if (item.serviceType === 'wash & iron') price = 5;
        else if (item.serviceType === 'iron') price = 3;
        else if (item.serviceType === 'wash') price = 4;
        else price = 2; // Default for 'other' or unlisted

        if (item.itemType === 'Suit') price *= 2;
        else if (item.itemType === 'Coat') price *= 1.5;
        return price * (parseInt(item.quantity, 10) || 0);
    }, []);


    useEffect(() => {
        const newTotal = items.reduce((sum, item) => sum + calculateItemPrice(item), 0);
        setTotalAmount(newTotal);
    }, [items, calculateItemPrice]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (customerSelectionMode === 'new' && (!customerInput.name || !customerInput.phone)) {
            setError('For new customers, name and phone are required.');
            setIsLoading(false);
            return;
        }
        if (customerSelectionMode === 'existing' && !selectedCustomerId) {
            setError('Please select an existing customer or switch to create a new one.');
            setIsLoading(false);
            return;
        }
        if (items.some(item => !item.itemType || !item.serviceType || item.quantity < 1)) {
            setError('All items must have a type, service, and quantity of at least 1.');
            setIsLoading(false);
            return;
        }

        const orderPayload = {
            items: items.map(({ id, ...rest }) => rest),
            expectedPickupDate,
            totalAmount,
            amountPaid: parseFloat(amountPaid) || 0,
            notes,
        };

        if (selectedCustomerId && customerSelectionMode === 'existing') {
            orderPayload.customerId = selectedCustomerId;
            // Backend needs to handle if customer details (name, phone etc. from customerInput) were updated for an existing customer
            // You might send customerInput as well for the backend to compare and update if necessary
            orderPayload.customerDetailsToUpdate = customerInput; // Backend will decide if these are used
        } else { // Creating new customer or backend will find/create based on details
            orderPayload.customerName = customerInput.name;
            orderPayload.customerPhone = customerInput.phone;
            orderPayload.customerEmail = customerInput.email;
            orderPayload.customerAddress = customerInput.address;
        }

        try {
            const response = isEditMode && initialOrderData?._id
                ? await updateExistingOrder(initialOrderData._id, orderPayload)
                : await createNewOrder(orderPayload);

            alert(`Order ${isEditMode ? 'updated' : 'created'} successfully! Receipt: ${response.data.receiptNumber}`);
            navigate(isEditMode ? `/orders/${response.data._id}` : '/');
        } catch (err) {
            const errMsg = err.response?.data?.message || `Failed to ${isEditMode ? 'save' : 'create'} order.`;
            setError(errMsg);
            console.error("Order submission error:", err.response || err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-apple-gray-200 dark:divide-apple-gray-700">
            {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-apple">
                    <p className="text-sm text-apple-red dark:text-red-300">{error}</p>
                </div>
            )}

            {/* Customer Section */}
            <div className="pt-2">
                <h3 className="text-xl font-semibold leading-7 text-apple-gray-900 dark:text-apple-gray-100">Customer Information</h3>
                <div className="mt-2 mb-4 flex space-x-4">
                    <Button type="button" onClick={() => { setCustomerSelectionMode('existing'); setSelectedCustomerId(null); setCustomerInput({ name: '', phone: '', email: '', address: '' }); }} variant={customerSelectionMode === 'existing' ? 'primary' : 'secondary'} iconLeft={<Search size={16}/>}>Existing Customer</Button>
                    <Button type="button" onClick={handleCreateNewCustomerToggle} variant={customerSelectionMode === 'new' ? 'primary' : 'secondary'} iconLeft={<UserPlus size={16}/>}>New Customer</Button>
                </div>

                {customerSelectionMode === 'existing' && (
                    <div className="space-y-4">
                        <Input label="Search Customer (Name/Phone)" id="customerSearch" value={customerSearchQuery} onChange={handleCustomerSearchChange} placeholder="Type to search..." prefixIcon={isSearchingCustomers ? <Spinner size="sm"/> : <Search size={16}/>} />
                        {searchedCustomers.length > 0 && (
                            <ul className="max-h-48 overflow-y-auto border border-apple-gray-300 dark:border-apple-gray-700 rounded-apple-md divide-y divide-apple-gray-200 dark:divide-apple-gray-700">
                                {searchedCustomers.map(cust => (
                                    <li key={cust._id} onClick={() => handleSelectCustomer(cust)} className="p-3 hover:bg-apple-gray-100 dark:hover:bg-apple-gray-800 cursor-pointer">
                                        <p className="font-medium text-apple-gray-800 dark:text-apple-gray-200">{cust.name}</p>
                                        <p className="text-sm text-apple-gray-500 dark:text-apple-gray-400">{cust.phone} {cust.email && `- ${cust.email}`}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {selectedCustomerId && <p className="text-sm text-apple-green flex items-center"><UserCheck size={16} className="mr-1"/> Selected: {customerInput.name} ({customerInput.phone})</p>}
                    </div>
                )}

                {/* Always show fields, populate if existing selected, or for new input */}
                <div className={`mt-6 grid grid-cols-1 gap-y-4 gap-x-6 sm:grid-cols-6 ${customerSelectionMode === 'existing' && !selectedCustomerId && 'opacity-50 pointer-events-none'}`}>
                    <div className="sm:col-span-3">
                        <Input label="Full Name" id="customerNameInput" name="name" value={customerInput.name} onChange={handleCustomerInputChange} required={customerSelectionMode === 'new'} disabled={customerSelectionMode === 'existing' && !selectedCustomerId && !isEditMode /* Allow edit if customer selected in edit mode */} />
                    </div>
                    <div className="sm:col-span-3">
                        <Input label="Phone Number" id="customerPhoneInput" name="phone" type="tel" value={customerInput.phone} onChange={handleCustomerInputChange} required={customerSelectionMode === 'new'} disabled={customerSelectionMode === 'existing' && !selectedCustomerId && !isEditMode}/>
                    </div>
                    <div className="sm:col-span-3">
                        <Input label="Email Address (Optional)" id="customerEmailInput" name="email" type="email" value={customerInput.email} onChange={handleCustomerInputChange} disabled={customerSelectionMode === 'existing' && !selectedCustomerId && !isEditMode}/>
                    </div>
                    <div className="sm:col-span-3">
                        <Input label="Address (Optional)" id="customerAddressInput" name="address" value={customerInput.address} onChange={handleCustomerInputChange} disabled={customerSelectionMode === 'existing' && !selectedCustomerId && !isEditMode}/>
                    </div>
                </div>
            </div>


            {/* Items Section */}
            <div className="pt-8">
                <h3 className="text-xl font-semibold">Clothing Items</h3>
                <div className="mt-6 space-y-4">
                    {items.map((item, index) => (
                        <OrderItemRow key={item.id} item={item} index={index} onRemove={() => handleRemoveItem(item.id)} onChange={handleItemChange} itemTypes={MOCK_ITEM_TYPES} serviceTypes={MOCK_SERVICE_TYPES} />
                    ))}
                    <Button type="button" onClick={handleAddItem} variant="secondary" iconLeft={<Plus size={16}/>}>Add Item</Button>
                </div>
            </div>

            {/* Order Details Section */}
            <div className="pt-8">
                <h3 className="text-xl font-semibold">Order Details</h3>
                <div className="mt-6 grid grid-cols-1 gap-y-4 gap-x-6 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                        <DatePicker label="Expected Pickup Date" id="expectedPickupDate" value={expectedPickupDate} onChange={(e) => setExpectedPickupDate(e.target.value)} required min={format(new Date(), 'yyyy-MM-dd')} />
                    </div>
                    <div className="sm:col-span-3">
                        <Input label="Total Amount (FCFA)" id="totalAmount" type="number" value={totalAmount.toFixed(2)} readOnly className="bg-apple-gray-100 dark:bg-apple-gray-800" />
                    </div>
                    <div className="sm:col-span-3">
                        <Input label="Amount Paid (FCFA)" id="amountPaid" name="amountPaid" type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} step="0.01" min="0" />
                    </div>
                     <div className="sm:col-span-6">
                        <label htmlFor="notes" className="block text-sm font-medium">Order Notes</label>
                        <textarea id="notes" name="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="form-textarea block w-full sm:text-sm" />
                    </div>
                </div>
            </div>

            <div className="pt-6 flex items-center justify-end gap-x-3">
                <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
                <Button type="submit" variant="primary" isLoading={isLoading} iconLeft={<Save size={18}/>}>
                    {isEditMode ? 'Save Changes' : 'Create Order'}
                </Button>
            </div>
        </form>
    );
};

export default CreateOrderForm;