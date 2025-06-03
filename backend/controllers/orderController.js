// server/controllers/orderController.js
import Order from '../models/Order.js';
import Customer from '../models/Customer.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { generateReceiptNumber } from '../utils/generateReceiptNumber.js';
import { sendNotification } from '../services/notificationService.js';

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private (Staff/Admin)
const createOrder = asyncHandler(async (req, res) => {
    const {
        customerId, // If provided, we use this existing customer
        customerName, customerPhone, customerEmail, customerAddress, // For new customer or updating existing via form
        items,
        subTotalAmount,
        discountType,
        discountValue,
        expectedPickupDate,
        notes,
        amountPaid,
    } = req.body;

    // --- Basic Order Validation ---
    if (!items || items.length === 0) { res.status(400); throw new Error('No order items provided'); }
    if (!expectedPickupDate) { res.status(400); throw new Error('Expected pickup date is required'); }
    if (subTotalAmount === undefined || parseFloat(subTotalAmount) < 0) { res.status(400); throw new Error('Valid subtotal amount is required'); }

    let customerDoc; // This will hold the Mongoose document for the customer
    const providedEmail = customerEmail ? customerEmail.trim().toLowerCase() : undefined; // Standardize incoming email

    if (customerId) { // --- Scenario 1: Frontend explicitly provides an existing customer ID ---
        customerDoc = await Customer.findById(customerId);
        if (!customerDoc) {
            res.status(404); throw new Error('Customer not found with the provided ID.');
        }

        // Update this existing customer's details if new ones are provided in the form
        let customerWasModified = false;
        if (customerName && customerName.trim() !== customerDoc.name) { customerDoc.name = customerName.trim(); customerWasModified = true; }

        if (customerPhone && customerPhone.trim() !== customerDoc.phone) {
            const existingByPhone = await Customer.findOne({ phone: customerPhone.trim(), _id: { $ne: customerDoc._id } });
            if (existingByPhone) { res.status(400); throw new Error('This phone number is already in use by another customer.'); }
            customerDoc.phone = customerPhone.trim(); customerWasModified = true;
        }

        const currentCustomerEmail = (customerDoc.email || '').toLowerCase();
        if (providedEmail !== undefined && providedEmail !== currentCustomerEmail) {
            if (providedEmail) { // Only check for duplicates if new email is not empty
                const existingByEmail = await Customer.findOne({ email: providedEmail, _id: { $ne: customerDoc._id } });
                if (existingByEmail) { res.status(400); throw new Error('This email address is already in use by another customer.'); }
            }
            customerDoc.email = providedEmail; // Allows setting to empty string or new value
            customerWasModified = true;
        }

        if (customerAddress !== undefined && customerAddress.trim() !== (customerDoc.address || '')) { customerDoc.address = customerAddress.trim(); customerWasModified = true; }

        if (customerWasModified) {
            console.log("[OrderController Create] Updating existing customer (by ID):", customerDoc.name);
            await customerDoc.save();
        }

    } else if (customerName && customerPhone) { // --- Scenario 2: No customerId, try to find by phone OR create new ---
        const phoneToSearch = customerPhone.trim();
        let existingCustomerByPhone = await Customer.findOne({ phone: phoneToSearch });

        if (existingCustomerByPhone) {
            console.log("[OrderController Create] Found existing customer by phone:", existingCustomerByPhone.name);
            customerDoc = existingCustomerByPhone;
            let customerWasModified = false;

            // Update details if provided and different
            if (customerName && customerName.trim() !== customerDoc.name) { customerDoc.name = customerName.trim(); customerWasModified = true; }
            // Phone is the same (it was used for lookup), no need to update phone here

            const currentCustomerEmail = (customerDoc.email || '').toLowerCase();
            if (providedEmail !== undefined && providedEmail !== currentCustomerEmail) {
                if (providedEmail) {
                    const existingByEmail = await Customer.findOne({ email: providedEmail, _id: { $ne: customerDoc._id } }); // Exclude self
                    if (existingByEmail) { res.status(400); throw new Error('This email address is already in use by another customer.'); }
                }
                customerDoc.email = providedEmail; customerWasModified = true;
            }
            if (customerAddress !== undefined && customerAddress.trim() !== (customerDoc.address || '')) { customerDoc.address = customerAddress.trim(); customerWasModified = true; }

            if (customerWasModified) {
                console.log("[OrderController Create] Updating details of customer found by phone:", customerDoc.name);
                await customerDoc.save();
            }
        } else {
            // No customer found by phone, so we are creating a NEW customer.
            // Check if the provided email (if any) is already in use by anyone.
            console.log("[OrderController Create] No customer found by phone, attempting to create new.");
            if (providedEmail) {
                const existingByEmail = await Customer.findOne({ email: providedEmail });
                if (existingByEmail) {
                    res.status(400); throw new Error('This email address is already in use. Please use a different email or find the customer associated with this email.');
                }
            }
            customerDoc = await Customer.create({
                name: customerName.trim(),
                phone: phoneToSearch,
                email: providedEmail,
                address: customerAddress ? customerAddress.trim() : undefined,
            });
            console.log("[OrderController Create] New customer created:", customerDoc.name);
        }
    } else {
        res.status(400); throw new Error('Customer details (Name and Phone) are required if no existing customer ID is provided.');
    }

    // --- Create Order ---
    const receiptNumber = await generateReceiptNumber();
    const order = new Order({
        receiptNumber,
        customer: customerDoc._id, // Use the resolved customerDoc's ID
        items,
        subTotalAmount: parseFloat(subTotalAmount),
        discountType: discountType || 'none',
        discountValue: parseFloat(discountValue) || 0,
        amountPaid: parseFloat(amountPaid) || 0,
        expectedPickupDate,
        notes,
        createdBy: req.user.id,
    });

    const createdOrder = await order.save();
    const populatedOrder = await Order.findById(createdOrder._id)
        .populate('customer', 'name phone email address')
        .populate('createdBy', 'username');
    res.status(201).json(populatedOrder);
});


// @desc    Update an order
// @route   PUT /api/orders/:id
// @access  Private (Staff/Admin)
const updateOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate('customer'); // Populate to get current customer data
    if (!order) { res.status(404); throw new Error('Order not found'); }

    const {
        items, subTotalAmount, discountType, discountValue,
        amountPaid, status, expectedPickupDate, actualPickupDate, notes,
        customerId, // ID of the customer to associate with the order (could be same or different)
        customerDetailsToUpdate // Object with name, phone, email, address to update for the associated customer
    } = req.body;

    let customerDocForOrder = order.customer; // Start with the order's current customer document

    // Scenario 1: A specific customerId is provided to associate/re-associate with the order
    if (customerId && customerDocForOrder?._id.toString() !== customerId) {
        const newCustomerToAssociate = await Customer.findById(customerId);
        if (!newCustomerToAssociate) { res.status(404); throw new Error('Specified new customer ID not found.'); }
        customerDocForOrder = newCustomerToAssociate; // This is the customer the order will now point to
        order.customer = customerDocForOrder._id; // Update the ref in the order
    }

    // Scenario 2: Update details of the customer currently associated with the order
    // (or the newly associated one from above)
    if (customerDetailsToUpdate && customerDocForOrder) {
        let customerModified = false;
        const providedEmailUpdate = customerDetailsToUpdate.email ? customerDetailsToUpdate.email.trim().toLowerCase() : undefined;

        if (customerDetailsToUpdate.name && customerDetailsToUpdate.name.trim() !== customerDocForOrder.name) {
            customerDocForOrder.name = customerDetailsToUpdate.name.trim(); customerModified = true;
        }
        if (customerDetailsToUpdate.phone && customerDetailsToUpdate.phone.trim() !== customerDocForOrder.phone) {
            const existingByPhone = await Customer.findOne({ phone: customerDetailsToUpdate.phone.trim(), _id: { $ne: customerDocForOrder._id } });
            if (existingByPhone) { res.status(400); throw new Error('Updated phone number is already in use by another customer.'); }
            customerDocForOrder.phone = customerDetailsToUpdate.phone.trim(); customerModified = true;
        }
        const currentCustomerEmail = (customerDocForOrder.email || '').toLowerCase();
        if (providedEmailUpdate !== undefined && providedEmailUpdate !== currentCustomerEmail) {
            if (providedEmailUpdate) {
                const existingByEmail = await Customer.findOne({ email: providedEmailUpdate, _id: { $ne: customerDocForOrder._id } });
                if (existingByEmail) { res.status(400); throw new Error('Updated email address is already in use by another customer.'); }
            }
            customerDocForOrder.email = providedEmailUpdate; customerModified = true;
        }
        if (customerDetailsToUpdate.address !== undefined && customerDetailsToUpdate.address.trim() !== (customerDocForOrder.address || '')) {
            customerDocForOrder.address = customerDetailsToUpdate.address.trim(); customerModified = true;
        }

        if (customerModified) {
            console.log("[OrderController Update] Updating associated customer details:", customerDocForOrder.name);
            await customerDocForOrder.save();
        }
    }

    // Update Order fields
    if (items !== undefined) order.items = items;
    if (subTotalAmount !== undefined) order.subTotalAmount = parseFloat(subTotalAmount);
    if (discountType !== undefined) order.discountType = discountType;
    if (discountValue !== undefined) order.discountValue = parseFloat(discountValue) || 0;
    if (amountPaid !== undefined) order.amountPaid = parseFloat(amountPaid);
    if (expectedPickupDate !== undefined) order.expectedPickupDate = expectedPickupDate;
    if (actualPickupDate !== undefined) order.actualPickupDate = actualPickupDate;
    if (notes !== undefined) order.notes = notes;

    if (status && status !== order.status) {
        // ... (Notification logic as before - ensure customerDocForOrder or order.customer is up-to-date for notification)
        order.status = status;
        if (status === 'Ready for Pickup' && !order.notified) {
            const customerForNotification = await Customer.findById(order.customer); // Use the ID from the order object
            if (customerForNotification && (customerForNotification.email || customerForNotification.phone)) {
                const notificationResult = await sendNotification(customerForNotification, 'readyForPickup', order);
                if (notificationResult.sent) { order.notified = true; order.notificationMethod = notificationResult.method; }
                else { order.notificationMethod = 'failed-auto'; console.warn(`[OrderController] Auto 'Ready for Pickup' notification FAILED for ${order.receiptNumber}: ${notificationResult.message}`); }
            } else { order.notificationMethod = 'no-contact-auto'; console.warn(`[OrderController] No contact for auto-notification: Order ${order.receiptNumber}, Customer ${customerForNotification?.name || 'ID ' + order.customer}.`); }
        }
    }

    const updatedOrder = await order.save();
    const populatedOrder = await Order.findById(updatedOrder._id)
        .populate('customer', 'name phone email address') // Ensure all needed fields are populated
        .populate('createdBy', 'username');
    res.json(populatedOrder);
});


// ... (getOrders, getOrderById, deleteOrder, manuallyNotifyCustomer functions as previously corrected)
// Make sure their .populate('customer', '...') includes 'name phone email address' if those are needed by sendNotification or frontend display.

export {
    createOrder,
    getOrders,
    getOrderById,
    updateOrder,
    deleteOrder,
    manuallyNotifyCustomer,
};