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
        customerId,
        customerName, customerPhone, customerEmail, customerAddress,
        items,
        subTotalAmount,
        discountType,
        discountValue,
        expectedPickupDate,
        notes,
        amountPaid,
    } = req.body;

    if (!items || items.length === 0) {
        res.status(400); throw new Error('No order items provided');
    }
    if (!expectedPickupDate) {
        res.status(400); throw new Error('Expected pickup date is required');
    }
    if (subTotalAmount === undefined || parseFloat(subTotalAmount) < 0) {
        res.status(400); throw new Error('Valid subtotal amount is required');
    }

    let customer;
    if (customerId) {
        customer = await Customer.findById(customerId);
        if (!customer) { res.status(404); throw new Error('Customer not found with the provided ID.'); }
        if (customerName && customerName !== customer.name) customer.name = customerName;
        if (customerPhone && customerPhone !== customer.phone) {
            const existingByPhone = await Customer.findOne({ phone: customerPhone, _id: { $ne: customer._id } });
            if (existingByPhone) throw new Error('Another customer with this phone number already exists.');
            customer.phone = customerPhone;
        }
        if (customerEmail !== undefined) { // Handle empty string to clear email
            if (customerEmail && customerEmail !== customer.email) {
                const existingByEmail = await Customer.findOne({ email: customerEmail, _id: { $ne: customer._id } });
                if (existingByEmail) throw new Error('Another customer with this email address already exists.');
            }
            customer.email = customerEmail; // Assigns empty string or new email
        }
        if (customerAddress !== undefined) customer.address = customerAddress; // Handles empty string
        if (customer.isModified()) await customer.save();

    } else if (customerName && customerPhone) {
        const updateData = { name: customerName, phone: customerPhone };
        // Only set email/address if they are provided (not undefined)
        // If they are empty strings, they will be saved as empty strings.
        // If they are undefined, they won't be included in $set, $setOnInsert handles new.
        if (customerEmail !== undefined) updateData.email = customerEmail;
        if (customerAddress !== undefined) updateData.address = customerAddress;

        customer = await Customer.findOneAndUpdate(
            { phone: customerPhone },
            { 
                $set: updateData, // Update these fields if customer found
                $setOnInsert: { // Only these if customer is new (name and phone already in updateData)
                    email: customerEmail === undefined ? undefined : customerEmail, // ensure undefined if not given
                    address: customerAddress === undefined ? undefined : customerAddress 
                }
            },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );
    } else {
        res.status(400); throw new Error('Customer ID or (Customer Name and Phone) are required.');
    }

    const receiptNumber = await generateReceiptNumber();
    const order = new Order({
        receiptNumber, customer: customer._id, items,
        subTotalAmount: parseFloat(subTotalAmount),
        discountType: discountType || 'none',
        discountValue: parseFloat(discountValue) || 0,
        amountPaid: parseFloat(amountPaid) || 0,
        expectedPickupDate, notes, createdBy: req.user.id,
    });

    const createdOrder = await order.save();
    const populatedOrder = await Order.findById(createdOrder._id).populate('customer', 'name phone email address').populate('createdBy', 'username');
    res.status(201).json(populatedOrder);
});

// @desc    Get all orders (with filtering and pagination)
// @route   GET /api/orders
// @access  Private (Staff/Admin)
const getOrders = asyncHandler(async (req, res) => { /* ... as before ... */ });

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private (Staff/Admin)
const getOrderById = asyncHandler(async (req, res) => { /* ... as before ... */ });

// @desc    Update an order
// @route   PUT /api/orders/:id
// @access  Private (Staff/Admin)
const updateOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate('customer');
    if (!order) { res.status(404); throw new Error('Order not found'); }

    const {
        items, subTotalAmount, discountType, discountValue,
        amountPaid, status, expectedPickupDate, actualPickupDate, notes,
        customerId, customerDetailsToUpdate
    } = req.body;

    // Customer Update Logic
    if (customerId && order.customer?._id.toString() !== customerId) { // Check if order.customer exists
        const newCustomer = await Customer.findById(customerId);
        if (!newCustomer) throw new Error('New customer ID provided but customer not found.');
        order.customer = newCustomer._id;
    } else if (customerDetailsToUpdate && order.customer) {
        const currentCustomer = await Customer.findById(order.customer._id);
        if(currentCustomer) {
            if (customerDetailsToUpdate.name !== undefined) currentCustomer.name = customerDetailsToUpdate.name;
            if (customerDetailsToUpdate.phone !== undefined && customerDetailsToUpdate.phone !== currentCustomer.phone) {
                 const existingByPhone = await Customer.findOne({ phone: customerDetailsToUpdate.phone, _id: { $ne: currentCustomer._id } });
                 if (existingByPhone) throw new Error('Another customer with this updated phone number already exists.');
                currentCustomer.phone = customerDetailsToUpdate.phone;
            }
            if (customerDetailsToUpdate.email !== undefined) { // Check if email key exists in update
                if (customerDetailsToUpdate.email && customerDetailsToUpdate.email !== currentCustomer.email) { // If new email is not empty and different
                    const existingByEmail = await Customer.findOne({ email: customerDetailsToUpdate.email, _id: { $ne: currentCustomer._id } });
                    if (existingByEmail) throw new Error('Another customer with this updated email address already exists.');
                }
                currentCustomer.email = customerDetailsToUpdate.email; // Allows setting to empty string or new value
            }
            if (customerDetailsToUpdate.address !== undefined) currentCustomer.address = customerDetailsToUpdate.address;
            if(currentCustomer.isModified()){ await currentCustomer.save(); }
        }
    }

    // Order fields update
    if (items !== undefined) order.items = items;
    if (subTotalAmount !== undefined) order.subTotalAmount = parseFloat(subTotalAmount);
    if (discountType !== undefined) order.discountType = discountType;
    if (discountValue !== undefined) order.discountValue = parseFloat(discountValue) || 0;
    if (amountPaid !== undefined) order.amountPaid = parseFloat(amountPaid);
    if (expectedPickupDate !== undefined) order.expectedPickupDate = expectedPickupDate;
    if (actualPickupDate !== undefined) order.actualPickupDate = actualPickupDate;
    if (notes !== undefined) order.notes = notes;

    // Status and Notification Logic
    if (status && status !== order.status) {
        order.status = status;
        if (status === 'Ready for Pickup' && !order.notified) {
            const customerForNotification = await Customer.findById(order.customer);
            if (customerForNotification && (customerForNotification.email || customerForNotification.phone)) {
                console.log(`[OrderController] Order ${order.receiptNumber} is 'Ready for Pickup'. Attempting automated notification for customer ${customerForNotification.name}.`);
                const notificationResult = await sendNotification(customerForNotification, 'readyForPickup', order);
                if (notificationResult.sent) {
                    order.notified = true; order.notificationMethod = notificationResult.method;
                } else {
                    order.notificationMethod = 'failed-auto';
                    console.warn(`[OrderController] Automated 'Ready for Pickup' notification FAILED for ${order.receiptNumber}: ${notificationResult.message}`);
                }
            } else { order.notificationMethod = 'no-contact-auto'; console.warn(`[OrderController] No contact for auto-notification: Order ${order.receiptNumber}, Customer ${customerForNotification?.name || 'ID ' + order.customer}.`); }
        }
    }

    const updatedOrder = await order.save();
    const populatedOrder = await Order.findById(updatedOrder._id).populate('customer', 'name phone email address').populate('createdBy', 'username');
    res.json(populatedOrder);
});

// @desc    Delete an order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
const deleteOrder = asyncHandler(async (req, res) => { /* ... as before ... */ });

// @desc    Manually trigger a notification for an order
// @route   POST /api/orders/:id/notify
// @access  Private (Staff/Admin)
const manuallyNotifyCustomer = asyncHandler(async (req, res) => { /* ... as before ... */ });

export { createOrder, getOrders, getOrderById, updateOrder, deleteOrder, manuallyNotifyCustomer };