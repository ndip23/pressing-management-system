// client/src/components/Orders/CreateOrderForm.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../UI/Input';
import Select from '../UI/Select';
import Button from '../UI/Button';
import DatePicker from '../UI/DatePicker';
import OrderItemRow from './OrderItemRow'; // Ensure this path is correct relative to this file
import Modal from '../UI/Modal';
import { createNewOrder, updateExistingOrder, fetchCustomers } from '../../services/api';
import { Plus, Save, UserPlus, Search, UserCheck, Edit2, CheckSquare, XSquare, AlertTriangle } from 'lucide-react';
import { format, parseISO, isValid as isValidDate, setHours, setMinutes, setSeconds } from 'date-fns';
import Spinner from '../UI/Spinner'; // Assuming Spinner is used in Input or Button components

const MOCK_ITEM_TYPES = ['Shirt', 'Trousers', 'Suit', 'Dress', 'Blouse', 'Jacket', 'Bedding', 'Scarf', 'Tie', 'Coat', 'Other'];
const MOCK_SERVICE_TYPES = [
    { value: 'wash', label: 'Wash' }, { value: 'dry clean', label: 'Dry Clean' },
    { value: 'iron', label: 'Iron Only' }, { value: 'wash & iron', label: 'Wash & Iron' },
    { value: 'special care', label: 'Special Care' },
];

const CreateOrderForm = ({ initialOrderData, isEditMode = false }) => {
    const navigate = useNavigate();

    const [customerInput, setCustomerInput] = useState({ name: '', phone: '', email: '', address: '' });
    const [selectedCustomerId, setSelectedCustomerId] = useState(null);
    const [customerSearchQuery, setCustomerSearchQuery] = useState('');
    const [searchedCustomers, setSearchedCustomers] = useState([]);
    const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
    const [customerSelectionMode, setCustomerSelectionMode] = useState(isEditMode && initialOrderData?.customer?._id ? 'existing' : 'new');

    const [items, setItems] = useState([{ id: Date.now(), itemType: '', serviceType: 'wash', quantity: 1, specialInstructions: '' }]);

    const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const defaultPickupDateOnly = format(threeDaysFromNow, 'yyyy-MM-dd');
    const defaultPickupTime = format(setHours(setMinutes(new Date(), 0), 17), 'HH:mm'); // Default to 5:00 PM

    const [expectedPickupDateOnly, setExpectedPickupDateOnly] = useState(defaultPickupDateOnly);
    const [expectedPickupTime, setExpectedPickupTime] = useState(defaultPickupTime);

    const [subTotal, setSubTotal] = useState(0);
    const [discountType, setDiscountType] = useState('none');
    const [discountValueState, setDiscountValueState] = useState('0');
    const [calculatedDiscountAmount, setCalculatedDiscountAmount] = useState(0);
    const [finalTotalAmount, setFinalTotalAmount] = useState(0);
    const [amountPaid, setAmountPaid] = useState('0'); // Represents "Advance Paid"
    const [notes, setNotes] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [orderDataForReview, setOrderDataForReview] = useState(null);

    const currencySymbol = 'FCFA'; // TODO: Get from settings context

    useEffect(() => {
        if (isEditMode && initialOrderData) {
            if (initialOrderData.customer) {
                setCustomerInput({ name: initialOrderData.customer.name || '', phone: initialOrderData.customer.phone || '', email: initialOrderData.customer.email || '', address: initialOrderData.customer.address || '' });
                setSelectedCustomerId(initialOrderData.customer._id);
                setCustomerSelectionMode('existing');
            } else if (initialOrderData.customerId) {
                setSelectedCustomerId(initialOrderData.customerId); setCustomerSelectionMode('existing');
                setCustomerInput({ name: initialOrderData.customerName || '', phone: initialOrderData.customerPhone || '', email: initialOrderData.customerEmail || '', address: initialOrderData.customerAddress || '' });
            }
            setItems(initialOrderData.items?.map(item => ({ ...item, id: item._id || Date.now() + Math.random(), quantity: item.quantity || 1 })) || [{ id: Date.now(), itemType: '', serviceType: 'wash', quantity: 1, specialInstructions: '' }]);
            if (initialOrderData.expectedPickupDate && isValidDate(parseISO(initialOrderData.expectedPickupDate))) {
                const initialDate = parseISO(initialOrderData.expectedPickupDate);
                setExpectedPickupDateOnly(format(initialDate, 'yyyy-MM-dd'));
                setExpectedPickupTime(format(initialDate, 'HH:mm'));
            } else { setExpectedPickupDateOnly(defaultPickupDateOnly); setExpectedPickupTime(defaultPickupTime); }
            setSubTotal(initialOrderData.subTotalAmount || 0);
            setDiscountType(initialOrderData.discountType || 'none');
            setDiscountValueState(String(initialOrderData.discountValue || 0));
            setAmountPaid(String(initialOrderData.amountPaid || 0)); // This is the advance paid
            setNotes(initialOrderData.notes || '');
        } else {
            setCustomerInput({ name: '', phone: '', email: '', address: '' });
            setSelectedCustomerId(null); setCustomerSelectionMode('new');
            setItems([{ id: Date.now(), itemType: '', serviceType: 'wash', quantity: 1, specialInstructions: '' }]);
            setExpectedPickupDateOnly(defaultPickupDateOnly); setExpectedPickupTime(defaultPickupTime);
            setSubTotal(0); setDiscountType('none'); setDiscountValueState('0'); setAmountPaid('0'); setNotes('');
        }
    }, [initialOrderData, isEditMode, defaultPickupDateOnly, defaultPickupTime]);

    const handleCustomerInputChange = (e) => setCustomerInput({ ...customerInput, [e.target.name]: e.target.value });
    const handleCustomerSearchChange = async (e) => {
        const query = e.target.value;
        setCustomerSearchQuery(query);
        if (query.length > 1) {
            setIsSearchingCustomers(true);
            try { const { data } = await fetchCustomers(query); setSearchedCustomers(data || []); }
            catch (err) { setSearchedCustomers([]); console.error("Customer search failed:", err); }
            finally { setIsSearchingCustomers(false); }
        } else { setSearchedCustomers([]); }
    };
    const handleSelectCustomer = (customer) => {
        setCustomerInput({ name: customer.name, phone: customer.phone, email: customer.email || '', address: customer.address || '' });
        setSelectedCustomerId(customer._id);
        setCustomerSearchQuery(''); setSearchedCustomers([]); setCustomerSelectionMode('existing');
    };
    const handleCreateNewCustomerToggle = () => { setCustomerSelectionMode('new'); setSelectedCustomerId(null); };

    const handleItemChange = (id, field, value) => {
        const newItems = items.map(item =>
            item.id === id ? { ...item, [field]: field === 'quantity' ? (parseInt(value, 10) || 1) : value } : item
        );
        setItems(newItems);
    };
    const handleAddItem = () => setItems([...items, { id: Date.now(), itemType: '', serviceType: 'wash', quantity: 1, specialInstructions: '' }]);
    const handleRemoveItem = (id) => setItems(items.filter(item => item.id !== id));

    const calculateItemPrice = useCallback((item) => {
        let pricePerUnit = 0;
        const qty = parseInt(item.quantity, 10) || 0;
        if (qty <= 0) return 0;
        if (item.serviceType === 'dry clean') pricePerUnit = 3000;
        else if (item.serviceType === 'wash & iron') pricePerUnit = 2000;
        else if (item.serviceType === 'iron') pricePerUnit = 500;
        else if (item.serviceType === 'wash') pricePerUnit = 1000;
        else if (item.serviceType === 'special care') pricePerUnit = 5000;
        else pricePerUnit = 2;
        if (item.itemType === 'Suit') pricePerUnit *= 2;
        else if (item.itemType === 'Coat') pricePerUnit *= 1.5;
        return parseFloat((pricePerUnit * qty).toFixed(2));
    }, []);

    useEffect(() => {
        const newSubTotal = items.reduce((sum, item) => sum + calculateItemPrice(item), 0);
        setSubTotal(parseFloat(newSubTotal.toFixed(2)));
    }, [items, calculateItemPrice]);

    useEffect(() => {
        let discount = 0;
        const currentDiscountValue = parseFloat(discountValueState) || 0;
        if (discountType === 'percentage' && subTotal > 0 && currentDiscountValue > 0) {
            discount = (subTotal * currentDiscountValue) / 100;
        } else if (discountType === 'fixed' && currentDiscountValue > 0) {
            discount = currentDiscountValue;
        }
        if (discount > subTotal) discount = subTotal;
        setCalculatedDiscountAmount(parseFloat(discount.toFixed(2)));
        setFinalTotalAmount(parseFloat((subTotal - discount).toFixed(2)));
    }, [subTotal, discountType, discountValueState]);

    const balanceDue = Math.max(0, finalTotalAmount - (parseFloat(amountPaid) || 0));

    const handleReviewOrder = (e) => {
        e.preventDefault(); setError('');
        if (customerSelectionMode === 'new' && (!customerInput.name || !customerInput.phone)) { setError('New customer: Name and Phone are required.'); return; }
        if (customerSelectionMode === 'existing' && !selectedCustomerId && !isEditMode) { setError('Please select an existing customer or create new.'); return; }
        if (items.some(item => !item.itemType || !item.serviceType || !item.quantity || parseInt(item.quantity, 10) < 1)) { setError('All items require type, service, and quantity (min 1).'); return; }
        if (!expectedPickupDateOnly || !isValidDate(parseISO(expectedPickupDateOnly)) || !expectedPickupTime) { setError('Valid expected pickup date and time are required.'); return; }

        const [hours, minutes] = expectedPickupTime.split(':').map(Number);
        let combinedDateTime = parseISO(expectedPickupDateOnly);
        combinedDateTime = setHours(combinedDateTime, hours);
        combinedDateTime = setMinutes(combinedDateTime, minutes);
        combinedDateTime = setSeconds(combinedDateTime, 0);

        setOrderDataForReview({
            isEditMode, customer: { ...customerInput, id: selectedCustomerId }, customerSelectionMode,
            items: items.map(({ id, ...rest }) => ({...rest, quantity: parseInt(rest.quantity, 10) || 1})),
            expectedPickupDate: combinedDateTime.toISOString(),
            subTotalAmount: subTotal, discountType, discountValue: parseFloat(discountValueState) || 0,
            calculatedDiscountAmount, finalTotalAmount,
            amountPaid: parseFloat(amountPaid) || 0, // This is the "Advance Paid"
            balanceDue: balanceDue, // For display in modal
            notes,
        });
        setShowConfirmationModal(true);
    };

    const handleConfirmAndCreateOrder = async () => {
        if (!orderDataForReview) { setError("Error: No order data for submission."); setShowConfirmationModal(false); return; }
        setIsLoading(true); setError(''); setShowConfirmationModal(false);

        const payload = {
            items: orderDataForReview.items, expectedPickupDate: orderDataForReview.expectedPickupDate,
            subTotalAmount: orderDataForReview.subTotalAmount, discountType: orderDataForReview.discountType,
            discountValue: orderDataForReview.discountValue,
            amountPaid: orderDataForReview.amountPaid, // This is the "Advance Paid"
            notes: orderDataForReview.notes,
        };
        if (orderDataForReview.customerSelectionMode === 'existing' && orderDataForReview.customer.id) {
            payload.customerId = orderDataForReview.customer.id;
            payload.customerDetailsToUpdate = { name: orderDataForReview.customer.name, phone: orderDataForReview.customer.phone, email: orderDataForReview.customer.email, address: orderDataForReview.customer.address };
        } else {
            payload.customerName = orderDataForReview.customer.name; payload.customerPhone = orderDataForReview.customer.phone;
            payload.customerEmail = orderDataForReview.customer.email; payload.customerAddress = orderDataForReview.customer.address;
        }
        try {
            const response = isEditMode && initialOrderData?._id ? await updateExistingOrder(initialOrderData._id, payload) : await createNewOrder(payload);
            alert(`Order ${isEditMode ? 'updated' : 'created'}! Receipt: ${response.data.receiptNumber}`);
            navigate(isEditMode ? `/orders/${response.data._id}` : '/');
        } catch (err) { setError(err.response?.data?.message || `Failed to ${isEditMode ? 'save' : 'create'} order.`); console.error(err.response || err);
        } finally { setIsLoading(false); }
    };

    const handleEditFromReview = () => setShowConfirmationModal(false);

    return (
        <>
            <form onSubmit={handleReviewOrder} className="space-y-8 divide-y divide-apple-gray-200 dark:divide-apple-gray-700">
                {error && (
                    <div className="p-3 mb-4 bg-red-100 text-apple-red rounded-apple border border-red-300 dark:border-red-700 dark:text-red-300 dark:bg-red-900/30">
                        <div className="flex items-center"> <AlertTriangle size={20} className="mr-2 flex-shrink-0" /> <span>{error}</span> </div>
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
                        <div className="sm:col-span-3"> <Input label="Full Name*" id="customerNameInput" name="name" value={customerInput.name} onChange={handleCustomerInputChange} required={customerSelectionMode === 'new'} /> </div>
                        <div className="sm:col-span-3"> <Input label="Phone Number*" id="customerPhoneInput" name="phone" type="tel" value={customerInput.phone} onChange={handleCustomerInputChange} required={customerSelectionMode === 'new'} /> </div>
                        <div className="sm:col-span-3"> <Input label="Email Address (Optional)" id="customerEmailInput" name="email" type="email" value={customerInput.email} onChange={handleCustomerInputChange} /> </div>
                        <div className="sm:col-span-3"> <Input label="Address (Optional)" id="customerAddressInput" name="address" value={customerInput.address} onChange={handleCustomerInputChange} /> </div>
                    </div>
                </div>

                {/* Items Section */}
                <div className="pt-8">
                    <h3 className="text-xl font-semibold leading-7 text-apple-gray-900 dark:text-apple-gray-100">Clothing Items</h3>
                    <div className="mt-6 space-y-4">
                        {items.map((item, index) => {
                            const itemPrice = calculateItemPrice(item);
                            return ( <OrderItemRow key={item.id} item={item} index={index} onRemove={() => handleRemoveItem(item.id)} onChange={handleItemChange} itemTypes={MOCK_ITEM_TYPES} serviceTypes={MOCK_SERVICE_TYPES} calculatedPrice={itemPrice} /> );
                        })}
                        <Button type="button" onClick={handleAddItem} variant="secondary" iconLeft={<Plus size={16}/>}>Add Item</Button>
                    </div>
                </div>

                {/* Order Summary, Discount & Dates Section */}
                <div className="pt-8">
                     <h3 className="text-xl font-semibold leading-7 text-apple-gray-900 dark:text-apple-gray-100">Order Summary, Discount & Dates</h3>
                    <div className="mt-6 grid grid-cols-1 gap-y-4 gap-x-6 sm:grid-cols-6">
                        <div className="sm:col-span-3"><Input label={`Subtotal (${currencySymbol})`} id="subTotal" type="text" value={subTotal.toFixed(2)} readOnly className="bg-apple-gray-100 dark:bg-apple-gray-800 cursor-default" /></div>
                        <div className="sm:col-span-3"> <Select label="Discount Type" id="discountType" value={discountType} onChange={(e) => { setDiscountType(e.target.value); if (e.target.value === 'none') setDiscountValueState('0'); }} options={[ { value: 'none', label: 'No Discount' }, { value: 'percentage', label: 'Percentage (%)' }, { value: 'fixed', label: `Fixed Amount (${currencySymbol})` }]} /> </div>
                        {discountType !== 'none' && ( <div className="sm:col-span-3"> <Input label={`Discount Value ${discountType === 'percentage' ? '(%)' : `(${currencySymbol})`}`} id="discountValueState" type="number" value={discountValueState} onChange={(e) => setDiscountValueState(e.target.value)} min="0" step={discountType === 'percentage' ? '0.1' : '0.01'} /> </div> )}
                        <div className="sm:col-span-3"><Input label={`Calculated Discount (${currencySymbol})`} id="calculatedDiscountDisplay" type="text" value={calculatedDiscountAmount.toFixed(2)} readOnly className="bg-apple-gray-100 dark:bg-apple-gray-800 cursor-default" /></div>
                        <div className="sm:col-span-3"><Input label={`Final Total Amount (${currencySymbol})`} id="finalTotalAmount" type="text" value={finalTotalAmount.toFixed(2)} readOnly className="font-semibold bg-apple-gray-100 dark:bg-apple-gray-800 cursor-default" /></div>
                        <div className="sm:col-span-3"><Input label={`Advance Paid (${currencySymbol})`} id="amountPaid" name="amountPaid" type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} step="0.01" min="0" /></div>
                        <div className="sm:col-span-3"><Input label={`Balance Due (${currencySymbol})`} id="balanceDueDisplay" type="text" value={balanceDue.toFixed(2)} readOnly className={`font-semibold cursor-default ${balanceDue > 0 ? 'text-apple-red dark:text-red-400' : 'text-apple-green dark:text-green-400'} bg-apple-gray-100 dark:bg-apple-gray-800`} /></div>
                        <div className="sm:col-span-3"><DatePicker label="Expected Pickup Date" id="expectedPickupDateOnly" value={expectedPickupDateOnly} onChange={(e) => setExpectedPickupDateOnly(e.target.value)} required min={format(new Date(), 'yyyy-MM-dd')} /></div>
                        <div className="sm:col-span-3"><Input label="Expected Pickup Time" id="expectedPickupTime" type="time" value={expectedPickupTime} onChange={(e) => setExpectedPickupTime(e.target.value)} required /></div>
                        <div className="sm:col-span-6"> <label htmlFor="notes" className="block text-sm font-medium text-apple-gray-700 dark:text-apple-gray-300 mb-1">Order Notes (Optional)</label> <textarea id="notes" name="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="form-textarea block w-full sm:text-sm  border-apple-gray-300 focus:border-apple-blue focus:ring-apple-blue dark:bg-apple-gray-800 dark:border-apple-gray-700 dark:text-apple-gray-100 dark:focus:border-apple-blue rounded-apple shadow-apple-sm" /> </div>
                    </div>
                </div>

                <div className="pt-6 flex items-center justify-end gap-x-3">
                    <Button type="button" variant="secondary" onClick={() => navigate(isEditMode && initialOrderData?._id ? `/orders/${initialOrderData._id}` : '/')} disabled={isLoading}>Cancel</Button>
                    <Button type="submit" variant="primary" isLoading={isLoading} iconLeft={<CheckSquare size={18}/>}>
                        {isEditMode ? 'Review Changes' : 'Review Order'}
                    </Button>
                </div>
            </form>

            {showConfirmationModal && orderDataForReview && (
                <Modal isOpen={showConfirmationModal} onClose={() => { if (!isLoading) setShowConfirmationModal(false); }} title={isEditMode ? "Confirm Order Changes" : "Confirm New Order"} size="2xl">
                    <div className="space-y-4 text-sm max-h-[70vh] overflow-y-auto p-1 custom-scrollbar">
                        <h3 className="text-lg font-semibold text-apple-gray-800 dark:text-apple-gray-100">Please review all details:</h3>
                        <div className="p-3 border rounded-apple-md dark:border-apple-gray-700 bg-apple-gray-50 dark:bg-apple-gray-800/30">
                            <h4 className="font-medium mb-1 text-apple-gray-700 dark:text-apple-gray-200">Customer:</h4>
                            <p><strong>Name:</strong> {orderDataForReview.customer.name || <span className="italic text-apple-red">Missing</span>}</p>
                            <p><strong>Phone:</strong> {orderDataForReview.customer.phone || <span className="italic text-apple-red">Missing</span>}</p>
                            {orderDataForReview.customer.email && <p><strong>Email:</strong> {orderDataForReview.customer.email}</p>}
                            {orderDataForReview.customer.address && <p><strong>Address:</strong> {orderDataForReview.customer.address}</p>}
                        </div>
                        <div className="p-3 border rounded-apple-md dark:border-apple-gray-700 bg-apple-gray-50 dark:bg-apple-gray-800/30">
                            <h4 className="font-medium mb-2 text-apple-gray-700 dark:text-apple-gray-200">Items:</h4>
                            {orderDataForReview.items.length > 0 ? orderDataForReview.items.map((item, index) => {
                                const itemPriceInReview = calculateItemPrice(item);
                                return (
                                    <div key={index} className={`mb-2 pb-2 ${index < orderDataForReview.items.length - 1 ? 'border-b dark:border-apple-gray-700/50' : ''}`}>
                                        <div className="flex justify-between">
                                            <span><strong>{item.quantity || 0}x {item.itemType || <span className="italic text-apple-red">Item type missing</span>}</strong> - Service: {item.serviceType || <span className="italic text-apple-red">Service missing</span>}</span>
                                            <span className="font-medium">{currencySymbol}{itemPriceInReview.toFixed(2)}</span>
                                        </div>
                                        {item.specialInstructions && <p className="text-xs italic text-apple-gray-600 dark:text-apple-gray-400">Instructions: {item.specialInstructions}</p>}
                                    </div>
                                );
                            }) : <p className="italic text-apple-gray-500">No items added.</p>}
                        </div>
                        <div className="p-3 border rounded-apple-md dark:border-apple-gray-700 bg-apple-gray-50 dark:bg-apple-gray-800/30">
                            <h4 className="font-medium mb-1 text-apple-gray-700 dark:text-apple-gray-200">Summary:</h4>
                            <p><strong>Subtotal:</strong> {currencySymbol}{orderDataForReview.subTotalAmount.toFixed(2)}</p>
                            {orderDataForReview.discountType !== 'none' && orderDataForReview.calculatedDiscountAmount > 0 && (
                                <p><strong>Discount ({orderDataForReview.discountType === 'percentage' ? `${orderDataForReview.discountValue}%` : `${currencySymbol}${orderDataForReview.discountValue.toFixed(2)}`}):</strong> -{currencySymbol}{orderDataForReview.calculatedDiscountAmount.toFixed(2)}</p>
                            )}
                            <p className="text-base font-semibold"><strong>Final Total:</strong> {currencySymbol}{orderDataForReview.finalTotalAmount.toFixed(2)}</p>
                            <p><strong>Advance Paid:</strong> {currencySymbol}{orderDataForReview.amountPaid.toFixed(2)}</p>
                            <p className={`font-semibold ${orderDataForReview.balanceDue > 0 ? 'text-apple-red' : 'text-apple-green'}`}>
                                <strong>Balance Due:</strong> {currencySymbol}{orderDataForReview.balanceDue.toFixed(2)}
                            </p>
                            <p><strong>Expected Pickup:</strong> {orderDataForReview.expectedPickupDate ? format(parseISO(orderDataForReview.expectedPickupDate), 'MMM d, yyyy, h:mm a') : <span className="italic text-apple-red">Missing</span>}</p>
                            {orderDataForReview.notes && <p className="mt-1"><strong>Order Notes:</strong> <span className="block whitespace-pre-wrap">{orderDataForReview.notes}</span></p>}
                        </div>
                        <p className="pt-2 text-center font-semibold text-apple-gray-700 dark:text-apple-gray-200">Is all information correct and ready to proceed?</p>
                    </div>
                    <div className="mt-6 pt-4 border-t dark:border-apple-gray-700 flex flex-wrap justify-end gap-3">
                        <Button variant="secondary" onClick={handleEditFromReview} iconLeft={<Edit2 size={16}/>} disabled={isLoading}>Edit Details</Button>
                        <Button variant="ghost" onClick={() => setShowConfirmationModal(false)} disabled={isLoading} className="text-apple-red" iconLeft={<XSquare size={16}/>}>Cancel</Button>
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