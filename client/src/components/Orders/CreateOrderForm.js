// client/src/components/Orders/CreateOrderForm.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../UI/Input'; // Assuming Input is fine
import Select from '../UI/Select'; // Assuming Select is fine
import Button from '../UI/Button';
import DatePicker from '../UI/DatePicker'; // Assuming DatePicker is fine
import OrderItemRow from './OrderItemRow';
import Modal from '../UI/Modal';
import { createNewOrder, updateExistingOrder, fetchCustomers } from '../../services/api';
import { Plus, Save, UserPlus, Search, UserCheck, Edit2, CheckSquare, XSquare, AlertTriangle } from 'lucide-react';
import { format, parseISO, isValid as isValidDate, setHours, setMinutes, setSeconds } from 'date-fns';
import Spinner from '../UI/Spinner';

const MOCK_ITEM_TYPES = [/* ... */];
const MOCK_SERVICE_TYPES = [/* ... */];

const CreateOrderForm = ({ initialOrderData, isEditMode = false }) => {
    const navigate = useNavigate();
    console.log("[CreateOrderForm] Component Rendering. isEditMode:", isEditMode, "InitialData:", !!initialOrderData);

    // --- STATE ---
    const [customerInput, setCustomerInput] = useState({ name: '', phone: '', email: '', address: '' });
    // ... (all other state variables as before: selectedCustomerId, items, dates, amounts, isLoading, error, modal states)
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    // ... (expectedPickupDateOnly, expectedPickupTime, etc.)

    // --- useEffect for initial data population ---
    useEffect(() => {
        try {
            console.log("[CreateOrderForm] useEffect for initialOrderData. isEditMode:", isEditMode);
            if (isEditMode && initialOrderData) {
                console.log("[CreateOrderForm] Populating form for EDIT mode.");
                // ... (your existing logic to populate form from initialOrderData)
                // Example: setCustomerInput({ name: initialOrderData.customer?.name || '', ... });
            } else {
                console.log("[CreateOrderForm] Resetting form for NEW order.");
                // ... (your existing logic to reset form fields)
                setError(''); // Clear error on mode change
            }
        } catch (e) {
            console.error("!!! FRONTEND ERROR in useEffect [initialOrderData]:", e);
            setError(`Initialization Error: ${e.message}`);
        }
    }, [initialOrderData, isEditMode /*, other relevant dependencies like default dates */]);

    // --- Other useEffects (for subTotal, discount calculations) ---
    // Add try...catch within these if they involve complex state or external calls (though they shouldn't call getValue)
    const calculateItemPrice = useCallback((item) => { /* ... */ return 0; }, []); // Keep your pricing logic
    useEffect(() => {
        try {
            const newSubTotal = items.reduce((sum, item) => sum + calculateItemPrice(item), 0);
            setSubTotal(parseFloat(newSubTotal.toFixed(2)));
        } catch(e) { console.error("!!! FRONTEND ERROR in useEffect [subTotal]:", e); }
    }, [items, calculateItemPrice]);
    // ... (useEffect for discount calculation - add try...catch if complex)

    // --- Event Handlers ---
    const handleCustomerInputChange = (e) => {
        try {
            setCustomerInput({ ...customerInput, [e.target.name]: e.target.value });
        } catch (e) { console.error("!!! FRONTEND ERROR in handleCustomerInputChange:", e); }
    };
    // Add try...catch to other handlers like handleItemChange if you suspect them

    const handleReviewOrder = (e) => {
        e.preventDefault(); setError('');
        console.log("[CreateOrderForm] handleReviewOrder called.");
        try {
            // --- ALL YOUR VALIDATION LOGIC ---
            // ...
            // --- GATHERING DATA FOR REVIEW ---
            // const [hours, minutes] = expectedPickupTime.split(':').map(Number);
            // let combinedDateTime = parseISO(expectedPickupDateOnly);
            // ... combine date and time ...
            // const dataToReview = { ... };
            // console.log("[CreateOrderForm] Data for review:", dataToReview);
            // setOrderDataForReview(dataToReview);
            // setShowConfirmationModal(true);

            // For now, let's try to construct the payload directly here and log it,
            // to see if the error happens *before* even showing the modal.
            const [hours, minutes] = expectedPickupTime.split(':').map(Number);
            let combinedDateTime = parseISO(expectedPickupDateOnly);
            if (!isValidDate(combinedDateTime)) { throw new Error('Invalid pickup date during review prep.'); }
            combinedDateTime = setHours(combinedDateTime, hours);
            combinedDateTime = setMinutes(combinedDateTime, minutes);
            combinedDateTime = setSeconds(combinedDateTime, 0);

            const testPayload = {
                items: items.map(({ id, ...rest }) => ({...rest, quantity: parseInt(rest.quantity, 10) || 1})),
                expectedPickupDate: combinedDateTime.toISOString(),
                subTotalAmount: subTotal,
                discountType: discountType,
                discountValue: parseFloat(discountValueState) || 0,
                amountPaid: parseFloat(amountPaid) || 0,
                notes: notes,
                customerName: customerInput.name, // Example for new customer
                customerPhone: customerInput.phone,
                // ... include all fields the backend createOrder expects
            };
            console.log("[CreateOrderForm] TEST PAYLOAD before modal:", JSON.stringify(testPayload, null, 2));
            // If the above log works, then proceed to set for modal
            setOrderDataForReview({ /* ... full data for review modal ... */ });
            setShowConfirmationModal(true);

        } catch (e) {
            console.error("!!! FRONTEND ERROR in handleReviewOrder:", e);
            console.error("Stack trace for handleReviewOrder error:", e.stack);
            setError(`Error preparing order for review: ${e.message}. Check console for details.`);
        }
    };

    const handleConfirmAndCreateOrder = async () => {
        // ... (existing logic, which includes API call) ...
        // This function is called *after* review, so the "this.getValue" error
        // is likely happening *before* this, during form interaction or review preparation.
    };

    // ... (rest of the component: JSX) ...

    // --- In your JSX, for any suspect input, especially custom ones or textareas: ---
    // Example for notes textarea, if it's a custom component or uses a ref:
    // <TextareaComponent
    //   value={notes}
    //   onChange={(newValue) => {
    //     try {
    //       setNotes(newValue); // Or whatever the API of TextareaComponent is
    //     } catch (e) { console.error("!!! FRONTEND ERROR setting notes:", e); }
    //   }}
    // />
    // If 'notes' was using a ref:
    // const notesRef = useRef(null);
    // <textarea ref={notesRef} defaultValue={notes} />
    // And you were trying to get value using notesRef.current.getValue() -> THIS WOULD BE WRONG for standard textarea.
    // It should be notesRef.current.value

    return (
        <>
            <form onSubmit={handleReviewOrder} className="space-y-8 divide-y ...">
                {error && (
                    <div className="p-3 mb-4 bg-red-100 text-apple-red ...">
                        <div className="flex items-center">
                            <AlertTriangle size={20} className="mr-2 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    </div>
                )}
                {/* All your form sections: Customer, Items, Summary */}
                {/* Ensure all <Input>, <Select>, <DatePicker>, <OrderItemRow> are correctly implemented */}
                {/* and their `value` and `onChange` props are correctly tied to your state variables. */}
            </form>
            {/* ... Modal ... */}
        </>
    );
};
export default CreateOrderForm;