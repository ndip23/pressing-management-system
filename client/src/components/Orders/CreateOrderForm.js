// client/src/components/Orders/CreateOrderForm.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../UI/Input';
import Select from '../UI/Select';
import Button from '../UI/Button';
import DatePicker from '../UI/DatePicker';
import OrderItemRow from './OrderItemRow';
import Modal from '../UI/Modal';
import Spinner from '../UI/Spinner';
import {
  createNewOrder,
  updateExistingOrder,
  fetchCustomers,
  fetchAppSettings,
  fetchPrices,
} from '../../services/api';
import {
  Plus,
  Save,
  UserPlus,
  Search,
  UserCheck,
  Edit2,
  CheckSquare,
  XSquare,
  AlertTriangle,
} from 'lucide-react';
import {
  format,
  parseISO,
  isValid as isValidDate,
  setHours,
  setMinutes,
  setSeconds,
} from 'date-fns';

const CreateOrderForm = ({ initialOrderData, isEditMode = false }) => {
  const navigate = useNavigate();

  const [operationalData, setOperationalData] = useState({
    itemTypes: [],
    serviceTypes: [],
    priceList: [],
    currencySymbol: 'FCFA',
    loading: true,
  });

  useEffect(() => {
    const loadOperationalData = async () => {
      try {
        const settingsRes = await fetchAppSettings();
        const pricesRes = await fetchPrices();

        setOperationalData({
          itemTypes: settingsRes.data.itemTypes || [],
          serviceTypes: settingsRes.data.serviceTypes || [],
          priceList: pricesRes.data || [],
          currencySymbol: settingsRes.data.defaultCurrencySymbol || 'FCFA',
          loading: false,
        });
      } catch (error) {
        console.error('Failed to load operational data:', error);
        setOperationalData((prev) => ({ ...prev, loading: false }));
      }
    };
    loadOperationalData();
  }, []);

  const getItemPrice = useCallback((itemType, serviceType) => {
    const priceEntry = operationalData.priceList.find(
      (p) => p.itemType === itemType && p.serviceType === serviceType
    );
    return priceEntry ? priceEntry.price : 0;
  }, [operationalData.priceList]);

  const [items, setItems] = useState([{
    id: Date.now(),
    itemType: '',
    serviceType: 'wash',
    quantity: 1,
    specialInstructions: '',
  }]);

  const [subTotal, setSubTotal] = useState(0);
  const [discountType, setDiscountType] = useState('none');
  const [discountValueState, setDiscountValueState] = useState('0');
  const [calculatedDiscountAmount, setCalculatedDiscountAmount] = useState(0);
  const [finalTotalAmount, setFinalTotalAmount] = useState(0);
  const [amountPaid, setAmountPaid] = useState('0');
  const [notes, setNotes] = useState('');
  const [expectedPickupDateOnly, setExpectedPickupDateOnly] = useState(format(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [expectedPickupTime, setExpectedPickupTime] = useState('17:00');

  const [customerInput, setCustomerInput] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerSelectionMode, setCustomerSelectionMode] = useState('new');

  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [orderDataForReview, setOrderDataForReview] = useState(null);

  const handleItemChange = (id, field, value) => {
    const newItems = items.map((item) =>
      item.id === id
        ? {
            ...item,
            [field]: field === 'quantity' ? parseInt(value, 10) || 1 : value,
          }
        : item
    );
    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([...items, {
      id: Date.now(),
      itemType: '',
      serviceType: 'wash',
      quantity: 1,
      specialInstructions: '',
    }]);
  };

  const handleRemoveItem = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleCustomerInputChange = (e) => {
    setCustomerInput({ ...customerInput, [e.target.name]: e.target.value });
  };

  const handleReviewOrder = (e) => {
    e.preventDefault();
    const [hours, minutes] = expectedPickupTime.split(':').map(Number);
    let pickupDate = setHours(setMinutes(parseISO(expectedPickupDateOnly), minutes), hours);
    pickupDate = setSeconds(pickupDate, 0);

    const reviewData = {
      customer: { ...customerInput, id: selectedCustomerId },
      customerSelectionMode,
      items: items.map((item) => ({
        ...item,
        quantity: parseInt(item.quantity, 10) || 1,
      })),
      expectedPickupDate: pickupDate.toISOString(),
      subTotalAmount: subTotal,
      discountType,
      discountValue: parseFloat(discountValueState) || 0,
      calculatedDiscountAmount,
      finalTotalAmount,
      amountPaid: parseFloat(amountPaid) || 0,
      notes,
      balanceDue: Math.max(0, finalTotalAmount - (parseFloat(amountPaid) || 0)),
    };

    setOrderDataForReview(reviewData);
    setShowConfirmationModal(true);
  };

  const handleConfirmAndCreateOrder = async () => {
    if (!orderDataForReview) return;
    const payload = {
      items: orderDataForReview.items,
      expectedPickupDate: orderDataForReview.expectedPickupDate,
      subTotalAmount: orderDataForReview.subTotalAmount,
      discountType: orderDataForReview.discountType,
      discountValue: orderDataForReview.discountValue,
      amountPaid: orderDataForReview.amountPaid,
      notes: orderDataForReview.notes,
    };

    if (orderDataForReview.customerSelectionMode === 'existing' && orderDataForReview.customer.id) {
      payload.customerId = orderDataForReview.customer.id;
    } else {
      payload.customerName = orderDataForReview.customer.name;
      payload.customerPhone = orderDataForReview.customer.phone;
      payload.customerEmail = orderDataForReview.customer.email;
      payload.customerAddress = orderDataForReview.customer.address;
    }

    try {
      const response = isEditMode
        ? await updateExistingOrder(initialOrderData._id, payload)
        : await createNewOrder(payload);
      alert(`Order ${isEditMode ? 'updated' : 'created'}: ${response.data.receiptNumber}`);
      navigate(isEditMode ? `/orders/${response.data._id}` : '/');
    } catch (error) {
      console.error('Error submitting order:', error);
    }
  };

  useEffect(() => {
    const newSubTotal = items.reduce((sum, item) => {
      const unitPrice = getItemPrice(item.itemType, item.serviceType);
      const qty = parseInt(item.quantity, 10) || 0;
      return sum + unitPrice * qty;
    }, 0);
    setSubTotal(parseFloat(newSubTotal.toFixed(2)));
  }, [items, getItemPrice]);

  useEffect(() => {
    let discount = 0;
    const val = parseFloat(discountValueState) || 0;
    if (discountType === 'percentage') discount = (subTotal * val) / 100;
    else if (discountType === 'fixed') discount = val;
    if (discount > subTotal) discount = subTotal;
    setCalculatedDiscountAmount(discount);
    setFinalTotalAmount(subTotal - discount);
  }, [discountType, discountValueState, subTotal]);

  const currencySymbol = operationalData.currencySymbol;

  return (
    <form onSubmit={handleReviewOrder} className="space-y-6">
      <Input name="name" label="Customer Name" value={customerInput.name} onChange={handleCustomerInputChange} />
      <Input name="phone" label="Phone Number" value={customerInput.phone} onChange={handleCustomerInputChange} />
      <Input name="email" label="Email" value={customerInput.email} onChange={handleCustomerInputChange} />
      <Input name="address" label="Address" value={customerInput.address} onChange={handleCustomerInputChange} />

      {items.map((item) => (
        <OrderItemRow
          key={item.id}
          item={item}
          itemTypes={operationalData.itemTypes}
          serviceTypes={operationalData.serviceTypes}
          onChange={(field, value) => handleItemChange(item.id, field, value)}
          onRemove={() => handleRemoveItem(item.id)}
          getItemPrice={getItemPrice}
          currencySymbol={currencySymbol}
        />
      ))}
      <Button type="button" onClick={handleAddItem} icon={<Plus size={16} />}>Add Item</Button>

      <Select
        label="Discount Type"
        value={discountType}
        onChange={(e) => setDiscountType(e.target.value)}
        options={[
          { value: 'none', label: 'None' },
          { value: 'percentage', label: 'Percentage' },
          { value: 'fixed', label: 'Fixed Amount' },
        ]}
      />
      <Input
        label="Discount Value"
        type="number"
        value={discountValueState}
        onChange={(e) => setDiscountValueState(e.target.value)}
      />
      <Input
        label="Amount Paid"
        type="number"
        value={amountPaid}
        onChange={(e) => setAmountPaid(e.target.value)}
      />
      <DatePicker
        label="Expected Pickup Date"
        value={expectedPickupDateOnly}
        onChange={setExpectedPickupDateOnly}
      />
      <Input
        label="Pickup Time"
        type="time"
        value={expectedPickupTime}
        onChange={(e) => setExpectedPickupTime(e.target.value)}
      />
      <Input
        label="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <div className="flex justify-end">
        <Button type="submit" icon={<Save size={16} />}>Review Order</Button>
      </div>

      {showConfirmationModal && orderDataForReview && (
        <Modal
          isOpen={showConfirmationModal}
          onClose={() => setShowConfirmationModal(false)}
          title="Confirm Order"
        >
          <div className="space-y-4 text-sm">
            <p><strong>Customer:</strong> {orderDataForReview.customer.name}</p>
            <p><strong>Total:</strong> {currencySymbol}{orderDataForReview.finalTotalAmount.toFixed(2)}</p>
            <p><strong>Balance:</strong> {currencySymbol}{orderDataForReview.balanceDue.toFixed(2)}</p>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => setShowConfirmationModal(false)}>Edit</Button>
            <Button variant="primary" onClick={handleConfirmAndCreateOrder}>Confirm</Button>
          </div>
        </Modal>
      )}
    </form>
  );
};

export default CreateOrderForm;
