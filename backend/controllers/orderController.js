// server/controllers/orderController.js
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Customer from '../models/Customer.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { generateReceiptNumber } from '../utils/generateReceiptNumber.js';
import { sendNotification } from '../services/notificationService.js';

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
    const { tenantId, user } = req;
    const {
        customerId, customerName, customerPhone, customerEmail, customerAddress,
        items, subTotalAmount, // Assuming you switched to subTotalAmount
        discountType, discountValue, // Assuming these are passed for discounts
        expectedPickupDate, notes, amountPaid,
    } = req.body;

    if (!items || items.length === 0) { res.status(400); throw new Error('Order must have at least one item.'); }
    if (!expectedPickupDate) { res.status(400); throw new Error('Expected pickup date is required.'); }
    if (subTotalAmount === undefined || parseFloat(subTotalAmount) < 0) { res.status(400); throw new Error('Valid subtotal amount is required.'); }

    let customer;

    if (customerId) {
        customer = await Customer.findOne({ _id: customerId, tenantId: tenantId });
        if (!customer) { res.status(404); throw new Error('Selected customer not found in your organization.'); }
        // Customer update logic if needed
        // ...
    } else if (customerName && customerPhone) {
        // This is the find-or-create logic that was causing the error
        customer = await Customer.findOneAndUpdate(
            // Filter: Find a customer with this phone number WITHIN this tenant
            { phone: customerPhone, tenantId: tenantId },
            
            // Update: Define what to update on an existing customer ($set)
            // and what to set only on a new customer ($setOnInsert)
            { 
                $set: { 
                    name: customerName,
                    address: customerAddress,
                    email: customerEmail ? customerEmail.toLowerCase() : undefined
                },
                $setOnInsert: {
                    name: customerName,
                    phone: customerPhone,
                    tenantId: tenantId // <<<<< CORRECTED: was 'tenantld' or missing
                }
            },
            
            // Options:
            // new: true -> return the new/updated document
            // upsert: true -> create a new document if one isn't found by the filter
            // runValidators: true -> ensure schema validation runs
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );
    } else {
        res.status(400); throw new Error('Customer information is required.');
    }

    // This part assumes your Order model has been updated for discounts and payments array
    const newOrderData = {
        receiptNumber: await generateReceiptNumber(),
        customer: customer._id,
        items,
        subTotalAmount: parseFloat(subTotalAmount) || 0,
        discountType: discountType || 'none',
        discountValue: parseFloat(discountValue) || 0,
        notes, expectedPickupDate, createdBy: user.id, tenantId,
        payments: [],
    };

    const initialPayment = parseFloat(amountPaid) || 0;
    if (initialPayment > 0) {
        newOrderData.payments.push({ amount: initialPayment, method: 'Cash', recordedBy: user.id, date: new Date() });
    }

    const order = new Order(newOrderData);
    const createdOrder = await order.save();
    const populatedOrder = await Order.findById(createdOrder._id).populate('customer').populate('createdBy', 'username');
    res.status(201).json(populatedOrder);
});

// @desc    Get all orders for the current tenant
// @route   GET /api/orders
// @access  Private
const getOrders = asyncHandler(async (req, res) => {
    // This function logic remains as you had it, scoped by tenantId
    const { tenantId } = req;
    const { paid, overdue, status, receiptNumber, customerId } = req.query;
    const pageSize = parseInt(req.query.pageSize, 10) || 20;
    const page = parseInt(req.query.page, 10) || 1;
    let query = { tenantId: tenantId };
    if (paid !== undefined) query.isFullyPaid = paid === 'true';
    if (overdue === 'true') { query.expectedPickupDate = { $lt: new Date() }; query.status = { $nin: ['Completed', 'Cancelled'] }; }
    if (status) query.status = status;
    if (receiptNumber) query.receiptNumber = { $regex: receiptNumber, $options: 'i' };
    if (customerId && mongoose.Types.ObjectId.isValid(customerId)) query.customer = customerId;
    const count = await Order.countDocuments(query);
    const orders = await Order.find(query).populate('customer', 'name phone').populate('createdBy', 'username').sort({ createdAt: -1 }).limit(pageSize).skip(pageSize * (page - 1));
    res.json({ orders, page, pages: Math.ceil(count / pageSize), totalOrders: count });
});

// @desc    Get a single order by ID for the current tenant
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
    // Scoped by tenantId
    const order = await Order.findOne({ _id: req.params.id, tenantId: req.tenantId }).populate('customer').populate('createdBy', 'username');
    if (!order) { res.status(404); throw new Error('Order not found.'); }
    res.json(order);
});

// @desc    Update an order
// @route   PUT /api/orders/:id
// @access  Private
const updateOrder = asyncHandler(async (req, res) => {
    // Scoped by tenantId
    const order = await Order.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!order) { res.status(404); throw new Error('Order not found.'); }
    
    // Logic from your provided code, with parseFloat for numbers
    const { items, subTotalAmount, discountType, discountValue, status, expectedPickupDate, notes } = req.body;
    if (items !== undefined) order.items = items;
    if (subTotalAmount !== undefined) order.subTotalAmount = parseFloat(subTotalAmount);
    if (discountType !== undefined) order.discountType = discountType;
    if (discountValue !== undefined) order.discountValue = parseFloat(discountValue) || 0;
    if (expectedPickupDate !== undefined) order.expectedPickupDate = expectedPickupDate;
    if (notes !== undefined) order.notes = notes;

    if (status && status !== order.status) {
        order.status = status;
        // notification logic...
        if (status === 'Ready for Pickup' && !order.notified) {
            const customerForNotification = await Customer.findById(order.customer);
            if (customerForNotification && (customerForNotification.email || customerForNotification.phone)) {
                const notificationResult = await sendNotification(customerForNotification, 'readyForPickup', order);
                if (notificationResult.sent) { order.notified = true; order.notificationMethod = notificationResult.method; }
                else { order.notificationMethod = 'failed-auto'; }
            } else { order.notificationMethod = 'no-contact-auto'; }
        }
    }
    const updatedOrder = await order.save();
    const populatedOrder = await Order.findById(updatedOrder._id).populate('customer').populate('createdBy', 'username');
    res.json(populatedOrder);
});

// @desc    Delete an order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
const deleteOrder = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) { res.status(400); throw new Error('Invalid Order ID format'); }
    // Scoped by tenantId
    const order = await Order.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!order) { res.status(404); throw new Error('Order not found'); }
    await order.deleteOne();
    res.json({ message: 'Order removed successfully' });
});

// @desc    Manually trigger a notification for an order
// @route   POST /api/orders/:id/notify
// @access  Private
const manuallyNotifyCustomer = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400); throw new Error('Invalid Order ID format');
    }
    const order = await Order.findById(req.params.id).populate('customer');
    if (!order) { res.status(404); throw new Error('Order not found'); }
    if (!order.customer) { res.status(400); throw new Error('Customer details not found for this order.'); }
    if (!order.customer.email && !order.customer.phone) { res.status(400); throw new Error('Customer has no email or phone number on file.');}

    const notificationResult = await sendNotification( order.customer, 'manualReminder', order );
    if (notificationResult.sent) {
        order.notified = true; order.notificationMethod = `manual-${notificationResult.method}`;
        await order.save();
        const populatedOrder = await Order.findById(order._id).populate('customer', 'name phone email address').populate('createdBy', 'username');
        res.json({ message: `Notification successfully sent via ${notificationResult.method}.`, order: populatedOrder });
    } else {
        const errorMessage = notificationResult.message || 'Failed to send manual notification. Check server logs.';
        console.error(`[OrderController] Manual notification FAILED for order ${order.receiptNumber}: ${errorMessage}`);
        res.status(500).json({ message: errorMessage });
    }
});

// --- YOUR ORIGINAL PAYMENT FUNCTIONS RESTORED ---

// @desc    Mark an order as fully paid by setting amountPaid to totalAmount
// @route   (You need to define a route for this, e.g., PUT /api/orders/:id/mark-fully-paid)
const markOrderAsFullyPaid = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) { res.status(400); throw new Error('Invalid Order ID format'); }
    const order = await Order.findOne({ _id: req.params.id, tenantId: req.tenantId }); // Scoped
    if (!order) { res.status(404); throw new Error('Order not found'); }

    if (order.isFullyPaid && order.amountPaid >= order.totalAmount) {
        console.log(`[OrderController] Order ${order.receiptNumber} is already paid.`);
    } else {
        order.amountPaid = order.totalAmount; // This will trigger pre-save to set isFullyPaid = true
        console.log(`[OrderController] Marking order ${order.receiptNumber} as fully paid. Setting amountPaid to totalAmount: ${order.totalAmount}`);
    }

    const updatedOrder = await order.save();
    const populatedOrder = await Order.findById(updatedOrder._id).populate('customer').populate('createdBy', 'username');
    res.json(populatedOrder);
});

// @desc    Mark an order as fully paid by settling the balance (pushing to payments array)
// @route   PUT /api/orders/:id/mark-paid
// @access  Private
const markOrderAsPaid = asyncHandler(async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, tenantId: req.tenantId }); // Scoped
    if (!order) { res.status(404); throw new Error('Order not found.'); }
    if (order.isFullyPaid) { return res.json(order); } 
    const balanceDue = order.totalAmount - order.amountPaid;
    if (balanceDue > 0) {
        order.payments.push({ amount: balanceDue, method: 'Cash', recordedBy: req.user.id });
    }
    const updatedOrder = await order.save();
    const populatedOrder = await Order.findById(updatedOrder._id).populate('customer').populate('createdBy', 'username');
    res.json(populatedOrder);
});

// @desc    Record a partial payment for an order
// @route   POST /api/orders/:id/payments
// @access  Private
const recordPartialPayment = asyncHandler(async (req, res) => {
    const { amount, method } = req.body;
    if (!amount || parseFloat(amount) <= 0) { res.status(400); throw new Error('A valid positive payment amount is required.'); }
    const order = await Order.findOne({ _id: req.params.id, tenantId: req.tenantId }); // Scoped
    if (!order) { res.status(404); throw new Error('Order not found.'); }
    if (order.isFullyPaid) { res.status(400); throw new Error('Order is already fully paid.'); }
    const paymentAmount = parseFloat(amount);
    const newTotalPaid = order.amountPaid + paymentAmount;
    if (newTotalPaid > order.totalAmount + 0.01) { res.status(400); throw new Error(`Payment of ${amount} exceeds balance due of ${(order.totalAmount - order.amountPaid).toFixed(2)}.`); }
    order.payments.push({ amount: paymentAmount, method: method || 'Cash', recordedBy: req.user.id });
    const updatedOrder = await order.save();
    const populatedOrder = await Order.findById(updatedOrder._id).populate('customer').populate('createdBy', 'username');
    res.json(populatedOrder);
});


export {
    createOrder, getOrders, getOrderById, updateOrder, deleteOrder,
    manuallyNotifyCustomer, markOrderAsPaid, recordPartialPayment, markOrderAsFullyPaid,
};