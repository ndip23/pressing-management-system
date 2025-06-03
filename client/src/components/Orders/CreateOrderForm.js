import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchOrderById, updateExistingOrder, sendManualNotification, createNewOrder, fetchCustomers } from '../../services/api';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Spinner from '../../components/UI/Spinner';
import OrderStatusBadge from '../../components/Dashboard/OrderStatusBadge';
import { ArrowLeft, Edit3, Printer, DollarSign, MessageSquare, AlertTriangle, CheckCircle2, Clock3, RefreshCw, Plus, UserPlus, UserCheck, CheckSquare } from 'lucide-react';
import { format, parseISO, isPast, isValid as isValidDate } from 'date-fns';
import Modal from '../UI/Modal';
import Input from '../UI/Input';
import Select from '../UI/Select';
import DatePicker from '../UI/DatePicker';
import OrderItemRow from './OrderItemRow';

// Mock data (to be replaced with dynamic data)
const MOCK_ITEM_TYPES = ['Shirt', 'Trousers', 'Suit', 'Dress', 'Blouse', 'Jacket', 'Bedding', 'Scarf', 'Tie', 'Coat', 'Other'];
const MOCK_SERVICE_TYPES = [
    { value: 'wash', label: 'Wash' },
    { value: 'dry clean', label: 'Dry Clean' },
    { value: 'iron', label: 'Iron Only' },
    { value: 'wash & iron', label: 'Wash & Iron' },
    { value: 'special care', label: 'Special Care' },
];

const DetailItem = ({ label, value, className = "", children }) => (
    <div className={`py-3 sm:grid sm:grid-cols-3 sm:gap-4 border-b border-apple-gray-100 dark:border-apple-gray-800 last:border-b-0 ${className}`}>
        <dt className="text-sm font-medium text-apple-gray-500 dark:text-apple-gray-400">{label}</dt>
        <dd className="mt-1 text-sm text-apple-gray-900 dark:text-apple-gray-100 sm:mt-0 sm:col-span-2">
            {children || value || <span className="italic text-apple-gray-400 dark:text-apple-gray-500">N/A</span>}
        </dd>
    </div>
);

const CreateOrderForm = ({ initialOrderData, isEditMode = false }) => {
    const navigate = useNavigate();

    const [customerInput, setCustomerInput] = useState({ name: '', phone: '', email: '', address: '' });
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [customerSearchQuery, setCustomerSearchQuery] = useState('');
    const [searchedCustomers, setSearchedCustomers] = useState([]);
    const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
    const [customerSelectionMode, setCustomerSelectionMode] = useState('new');

    const [items, setItems] = useState([{ id: Date.now(), itemType: '', serviceType: 'wash', quantity: 1, specialInstructions: '' }]);
    const defaultPickupDate = format(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
    const [expectedPickupDate, setExpectedPickupDate] = useState(defaultPickupDate);
    const [subTotal, setSubTotal] = useState(0);
    const [discountType, setDiscountType] = useState('none');
    const [discountValueState, setDiscountValueState] = useState('0');
    const [calculatedDiscountAmount, setCalculatedDiscountAmount] = useState(0);
    const [finalTotalAmount, setFinalTotalAmount] = useState(0);
    const [amountPaid, setAmountPaid] = useState('0');
    const [notes, setNotes] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [orderDataForReview, setOrderDataForReview] = useState(null);

    const loadOrder = useCallback(async (showLoadingSpinner = true) => {
        if (showLoadingSpinner) setLoading(true);
        setError(''); 
        setActionError(''); 
        setActionSuccess('');
        try {
            const { data } = await fetchOrderById(id);
            setOrder(data);
        } catch (err) {
            setError(err.response?.status === 404 ? 'Order not found.' : (err.response?.data?.message || 'Failed to fetch order details.'));
            console.error("Fetch Order Details Error:", err.response || err);
        } finally {
            if (showLoadingSpinner) setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (initialOrderData) {
            if (initialOrderData.customer) {
                setCustomerInput({
                    name: initialOrderData.customer.name || '',
                    phone: initialOrderData.customer.phone || '',
                    email: initialOrderData.customer.email || '',
                    address: initialOrderData.customer.address || '',
                });
                setSelectedCustomerId(initialOrderData.customer._id);
                setCustomerSelectionMode('existing');
            }
            setItems(initialOrderData.items?.map(item => ({ ...item, id: item._id || Date.now() + Math.random(), quantity: item.quantity || 1 })) || [{ id: Date.now(), itemType: '', serviceType: 'wash', quantity: 1, specialInstructions: '' }]);
            setExpectedPickupDate(initialOrderData.expectedPickupDate ? format(parseISO(initialOrderData.expectedPickupDate), 'yyyy-MM-dd') : defaultPickupDate);
            setSubTotal(initialOrderData.subTotalAmount || 0);
            setDiscountType(initialOrderData.discountType || 'none');
            setDiscountValueState(String(initialOrderData.discountValue || 0));
            setAmountPaid(String(initialOrderData.amountPaid || 0));
            setNotes(initialOrderData.notes || '');
        } else {
            setCustomerInput({ name: '', phone: '', email: '', address: '' });
            setSelectedCustomerId(null);
            setCustomerSelectionMode('new');
            setItems([{ id: Date.now(), itemType: '', serviceType: 'wash', quantity: 1, specialInstructions: '' }]);
            setExpectedPickupDate(defaultPickupDate);
            setSubTotal(0);
            setDiscountType('none');
            setDiscountValueState('0');
            setAmountPaid('0');
            setNotes('');
        }
    }, [initialOrderData, defaultPickupDate]);

    const handleCustomerInputChange = (e) => setCustomerInput({ ...customerInput, [e.target.name]: e.target.value });

    const handleCustomerSearchChange = async (e) => {
        const query = e.target.value;
        setCustomerSearchQuery(query);
        if (query.length > 1) {
            setIsSearchingCustomers(true);
            try {
                const { data } = await fetchCustomers(query);
                setSearchedCustomers(data || []);
            } catch (err) {
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
        setCustomerSelectionMode('existing');
    };

    const handleCreateNewCustomerToggle = () => {
        setCustomerSelectionMode('new');
        setSelectedCustomerId(null);
    };

    const handleItemChange = (id, field, value) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleAddItem = () => setItems([...items, { id: Date.now(), itemType: '', serviceType: 'wash', quantity: 1, specialInstructions: '' }]);

    const handleRemoveItem = (id) => setItems(items.filter(item => item.id !== id));

    const calculateItemPrice = useCallback((item) => {
        let price = 0;
        const qty = parseInt(item.quantity, 10) || 0;
        if (qty <= 0) return 0;

        if (item.serviceType === 'dry clean') price = 8;
        else if (item.serviceType === 'wash & iron') price = 5;
        else if (item.serviceType === 'iron') price = 3;
        else if (item.serviceType === 'wash') price = 4;
        else if (item.serviceType === 'special care') price = 10;
        else price = 2; // Default for 'other'

        if (item.itemType === 'Suit') price *= 2;
        else if (item.itemType === 'Coat') price *= 1.5;
        return price * qty;
    }, []);

    useEffect(() => {
        const newSubTotal = items.reduce((sum, item) => sum + calculateItemPrice(item), 0);
        setSubTotal(parseFloat(newSubTotal.toFixed(2)));
    }, [items, calculateItemPrice]);

    const handleReviewOrder = (e) => {
        e.preventDefault();
        setError('');
        if (customerSelectionMode === 'new' && (!customerInput.name || !customerInput.phone)) {
            setError('For new customers, name and phone are required.'); return;
        }
        if (customerSelectionMode === 'existing' && !selectedCustomerId && !isEditMode) {
            setError('Please select an existing customer or switch to create a new one.'); return;
        }
        if (items.some(item => !item.itemType || !item.serviceType || !item.quantity || item.quantity < 1)) {
            setError('All items must have a type, service, and valid quantity (at least 1).'); return;
        }

        const reviewData = {
            isEditMode,
            customer: { ...customerInput, id: selectedCustomerId },
            customerSelectionMode,
            items: items.map(({ id, ...rest }) => ({ ...rest, quantity: parseInt(rest.quantity, 10) || 1 })),
            expectedPickupDate,
            subTotalAmount: subTotal,
            amountPaid: parseFloat(amountPaid) || 0,
            notes,
        };
        setOrderDataForReview(reviewData);
        setShowConfirmationModal(true);
    };

    const handleConfirmAndCreateOrder = async () => {
        if (!orderDataForReview) {
            setError("Error: No order data available for submission.");
            setShowConfirmationModal(false);
            return;
        }
        setIsLoading(true);
        setError('');
        setShowConfirmationModal(false);

        const payload = {
            items: orderDataForReview.items,
            expectedPickupDate: orderDataForReview.expectedPickupDate,
            subTotalAmount: orderDataForReview.subTotalAmount,
            amountPaid: orderDataForReview.amountPaid,
            notes: orderDataForReview.notes,
        };

        if (orderDataForReview.customerSelectionMode === 'existing' && orderDataForReview.customer.id) {
            payload.customerId = orderDataForReview.customer.id;
            payload.customerDetailsToUpdate = {
                name: orderDataForReview.customer.name,
                phone: orderDataForReview.customer.phone,
                email: orderDataForReview.customer.email,
                address: orderDataForReview.customer.address,
            };
        } else {
            payload.customerName = orderDataForReview.customer.name;
            payload.customerPhone = orderDataForReview.customer.phone;
            payload.customerEmail = orderDataForReview.customer.email;
            payload.customerAddress = orderDataForReview.customer.address;
        }

        try {
            const response = isEditMode && initialOrderData?._id
                ? await updateExistingOrder(initialOrderData._id, payload)
                : await createNewOrder(payload);
            alert(`Order ${isEditMode ? 'updated' : 'created'} successfully! Receipt: ${response.data.receiptNumber}`);
            navigate(isEditMode ? `/orders/${response.data._id}` : '/');
        } catch (err) {
            const errMsg = err.response?.data?.message || `Failed to ${isEditMode ? 'save' : 'create'} order.`;
            setError(errMsg);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditFromReview = () => setShowConfirmationModal(false);

    return (
        <>
            <form onSubmit={handleReviewOrder} className="space-y-8 divide-y divide-apple-gray-200 dark:divide-apple-gray-700">
                {error && (
                    <div className="p-3 mb-4 bg-red-100 text-apple-red rounded-apple border border-red-300 dark:border-red-700 dark:text-red-300 dark:bg-red-900/30">
                        <div className="flex items-center">
                            <AlertTriangle size={20} className="mr-2 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
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
                        <div className="space-y-4 mb-4">
                            <Input label="Search Customer (Name/Phone)" id="customerSearch" value={customerSearchQuery} onChange={handleCustomerSearchChange} placeholder="Type to search..." prefixIcon={isSearchingCustomers ? <Spinner size="sm"/> : <Search size={16}/>} />
                            {searchedCustomers.length > 0 && (
                                <ul className="max-h-48 overflow-y-auto border border-apple-gray-300 dark:border-apple-gray-700 rounded-apple-md divide-y divide-apple-gray-200 dark:divide-apple-gray-700 bg-white dark:bg-apple-gray-800">
                                    {searchedCustomers.map(cust => (
                                        <li key={cust._id} onClick={() => handleSelectCustomer(cust)} className="p-3 hover:bg-apple-gray-100 dark:hover:bg-apple-gray-700/50 cursor-pointer">
                                            <p className="font-medium text-apple-gray-800 dark:text-apple-gray-200">{cust.name}</p>
                                            <p className="text-sm text-apple-gray-500 dark:text-apple-gray-400">{cust.phone} {cust.email && `- ${cust.email}`}</p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {selectedCustomerId && <p className="mt-2 text-sm text-apple-green flex items-center"><UserCheck size={16} className="mr-1"/> Selected: {customerInput.name} ({customerInput.phone})</p>}
                        </div>
                    )}

                    <div className={`mt-2 grid grid-cols-1 gap-y-4 gap-x-6 sm:grid-cols-6 ${customerSelectionMode === 'existing' && !selectedCustomerId && !isEditMode && 'opacity-60 pointer-events-none'}`}>
                        <div className="sm:col-span-3">
                            <Input label="Full Name" id="customerNameInput" name="name" value={customerInput.name} onChange={handleCustomerInputChange} required={customerSelectionMode === 'new'} />
                        </div>
                        <div className="sm:col-span-3">
                            <Input label="Phone Number" id="customerPhoneInput" name="phone" type="tel" value={customerInput.phone} onChange={handleCustomerInputChange} required={customerSelectionMode === 'new'} />
                        </div>
                        <div className="sm:col-span-3">
                            <Input label="Email Address (Optional)" id="customerEmailInput" name="email" type="email" value={customerInput.email} onChange={handleCustomerInputChange} />
                        </div>
                        <div className="sm:col-span-3">
                            <Input label="Address (Optional)" id="customerAddressInput" name="address" value={customerInput.address} onChange={handleCustomerInputChange} />
                        </div>
                    </div>
                </div>

                {/* Items Section */}
                <div className="pt-8">
                    <h3 className="text-xl font-semibold leading-7 text-apple-gray-900 dark:text-apple-gray-100">Clothing Items</h3>
                    <div className="mt-6 space-y-4">
                        {items.map((item, index) => (
                            <OrderItemRow key={item.id} item={item} index={index} onRemove={() => handleRemoveItem(item.id)} onChange={handleItemChange} itemTypes={MOCK_ITEM_TYPES} serviceTypes={MOCK_SERVICE_TYPES} />
                        ))}
                        <Button type="button" onClick={handleAddItem} variant="secondary" iconLeft={<Plus size={16}/>}>Add Item</Button>
                    </div>
                </div>

                {/* Order Summary Section */}
                <div className="pt-8">
                    <h3 className="text-xl font-semibold leading-7 text-apple-gray-900 dark:text-apple-gray-100">Order Summary & Dates</h3>
                    <div className="mt-6 grid grid-cols-1 gap-y-4 gap-x-6 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                            <DatePicker label="Expected Pickup Date" id="expectedPickupDate" value={expectedPickupDate} onChange={(e) => setExpectedPickupDate(e.target.value)} required min={format(new Date(), 'yyyy-MM-dd')} />
                        </div>
                        <div className="sm:col-span-3">
                            <Input label="Amount Paid ($)" id="amountPaid" name="amountPaid" type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} step="0.01" min="0" />
                        </div>
                       <div className="sm:col-span-3">
                            <Input label="Total Amount ($)" id="totalAmount" type="number" value={subTotal.toFixed(2)} readOnly className="bg-apple-gray-100 dark:bg-apple-gray-800 cursor-default" />
                        </div>
                        <div className="sm:col-span-3">
                            <Select label="Discount Type" id="discountType" value={discountType} onChange={(e) => setDiscountType(e.target.value)} options={[
                                { value: 'none', label: 'No Discount' },
                                { value: 'percentage', label: 'Percentage (%)' },
                                { value: 'fixed', label: 'Fixed Amount ($)' },
                            ]} />
                        </div>
                        {discountType !== 'none' && (
                            <div className="sm:col-span-3">
                                <Input label={`Discount Value ${discountType === 'percentage' ? '(%)' : '($)'}`} id="discountValueState" type="number" value={discountValueState} onChange={(e) => setDiscountValueState(e.target.value)} min="0" step={discountType === 'percentage' ? '0.1' : '0.01'} />
                            </div>
                        )}
                        <div className="sm:col-span-3">
                            <Input label="Calculated Discount ($)" id="calculatedDiscountDisplay" type="text" value={calculatedDiscountAmount.toFixed(2)} readOnly className="bg-apple-gray-100 dark:bg-apple-gray-800 cursor-default" />
                        </div>
                        <div className="sm:col-span-3">
                            <Input label="Final Total Amount ($)" id="finalTotalAmount" type="text" value={finalTotalAmount.toFixed(2)} readOnly className="font-semibold bg-apple-gray-100 dark:bg-apple-gray-800 cursor-default" />
                        </div>
                        <div className="sm:col-span-3">
                            <Input label="Amount Paid ($)" id="amountPaid" name="amountPaid" type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} step="0.01" min="0" />
                        </div>
                        <div className="sm:col-span-6">
                            <label htmlFor="notes" className="block text-sm font-medium text-apple-gray-700 dark:text-apple-gray-300 mb-1">Order Notes (Optional)</label>
                            <textarea id="notes" name="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="form-textarea block w-full sm:text-sm border-apple-gray-300 focus:border-apple-blue focus:ring-apple-blue dark:bg-apple-gray-800 dark:border-apple-gray-700 dark:text-apple-gray-100 dark:focus:border-apple-blue rounded-apple shadow-apple-sm" />
                        </div>
                    </div>
                </div>

                <div className="pt-6 flex items-center justify-end gap-x-3">
                    <Button type="button" variant="secondary" onClick={() => navigate(isEditMode ? `/orders/${initialOrderData?._id}` : '/')} disabled={isLoading}>Cancel</Button>
                    <Button type="submit" variant="primary" isLoading={isLoading} iconLeft={<CheckSquare size={18}/>}>
                        {isEditMode ? 'Review Changes' : 'Review Order'}
                    </Button>
                </div>
            </form>

            {showConfirmationModal && orderDataForReview && (
                <Modal
                    isOpen={showConfirmationModal}
                    onClose={() => { if (!isLoading) setShowConfirmationModal(false); }} // Prevent closing if submitting
                    title={isEditMode ? "Confirm Order Changes" : "Confirm New Order"}
                    size="2xl"
                >
                    <div className="space-y-4 text-sm max-h-[70vh] overflow-y-auto p-1 custom-scrollbar">
                        <h3 className="text-lg font-semibold text-apple-gray-800 dark:text-apple-gray-100">Please review all details:</h3>

                        <div className="p-3 border rounded-apple-md dark:border-apple-gray-700 bg-apple-gray-50 dark:bg-apple-gray-800/30">
                            <h4 className="font-medium mb-1">Customer:</h4>
                            <p><strong>Name:</strong> {orderDataForReview.customer.name || <span className="italic text-apple-red">Missing</span>}</p>
                            <p><strong>Phone:</strong> {orderDataForReview.customer.phone || <span className="italic text-apple-red">Missing</span>}</p>
                            {orderDataForReview.customer.email && <p><strong>Email:</strong> {orderDataForReview.customer.email}</p>}
                            {orderDataForReview.customer.address && <p><strong>Address:</strong> {orderDataForReview.customer.address}</p>}
                        </div>

                        <div className="p-3 border rounded-apple-md dark:border-apple-gray-700 bg-apple-gray-50 dark:bg-apple-gray-800/30">
                            <h4 className="font-medium mb-2">Items:</h4>
                            {orderDataForReview.items.length > 0 ? orderDataForReview.items.map((item, index) => (
                                <div key={index} className={`mb-2 pb-2 ${index < orderDataForReview.items.length - 1 ? 'border-b dark:border-apple-gray-700/50' : ''}`}>
                                    <p><strong>{item.quantity || 0}x {item.itemType || <span className="italic text-apple-red">Item type missing</span>}</strong> - Service: {item.serviceType || <span className="italic text-apple-red">Service missing</span>}</p>
                                    {item.specialInstructions && <p className="text-xs italic">Instructions: {item.specialInstructions}</p>}
                                </div>
                            )) : <p className="italic">No items added.</p>}
                        </div>

                        <div className="p-3 border rounded-apple-md dark:border-apple-gray-700 bg-apple-gray-50 dark:bg-apple-gray-800/30">
                            <h4 className="font-medium mb-1">Summary:</h4>
                            <p><strong>Subtotal:</strong> ${orderDataForReview.subTotalAmount.toFixed(2)}</p>
                            {orderDataForReview.discountType !== 'none' && orderDataForReview.calculatedDiscountAmount > 0 && (
                                <p><strong>Discount ({orderDataForReview.discountType === 'percentage' ? `${orderDataForReview.discountValue}%` : `$${orderDataForReview.discountValue.toFixed(2)}`}):</strong> -${orderDataForReview.calculatedDiscountAmount.toFixed(2)}</p>
                            )}
                            <p className="text-base font-semibold"><strong>Final Total:</strong> ${orderDataForReview.finalTotalAmount.toFixed(2)}</p>
                            <p><strong>Amount Paid:</strong> ${orderDataForReview.amountPaid.toFixed(2)}</p>
                            <p><strong>Expected Pickup:</strong> {orderDataForReview.expectedPickupDate ? format(parseISO(orderDataForReview.expectedPickupDate), 'MMM d, yyyy, h:mm a') : <span className="italic text-apple-red">Missing</span>}</p>
                            {orderDataForReview.notes && <p className="mt-1"><strong>Notes:</strong> <span className="block whitespace-pre-wrap">{orderDataForReview.notes}</span></p>}
                        </div>
                        <p className="pt-2 text-center font-semibold">Is all information correct and ready to proceed?</p>
                    </div>

                    <div className="mt-6 pt-4 border-t dark:border-apple-gray-700 flex flex-wrap justify-end gap-3">
                        <Button variant="secondary" onClick={handleEditFromReview} iconLeft={<Edit2 size={16}/>} disabled={isLoading}>Edit Details</Button>
                        <Button variant="ghost" onClick={() => setShowConfirmationModal(false)} disabled={isLoading} className="text-apple-red">Cancel</Button>
                        <Button variant="primary" onClick={handleConfirmAndCreateOrder} isLoading={isLoading} iconLeft={<Save size={16}/>}>
                            {isEditMode ? "Confirm & Save Changes" : "Confirm & Create Order"}
                        </Button>
                    </div>
                </Modal>
            )}
        </>
    );
};

export default CreateOrderForm; 