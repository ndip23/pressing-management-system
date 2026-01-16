// server/controllers/orderController.js
import mongoose from 'mongoose'; 
import Order from '../models/Order.js';
import Customer from '../models/Customer.js';
import Tenant from '../models/Tenant.js';
import Plan from '../models/Plan.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { generateReceiptNumber } from '../utils/generateReceiptNumber.js';
import { sendNotification } from '../services/notificationService.js';

const createOrder = asyncHandler(async (req, res) => {
    
    console.log("--------------- HITTING NEW ORDER CONTROLLER ---------------");
    const { tenantId, user } = req;

    // --- 1. SAFE ORDER LIMIT CHECK ---
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
        res.status(404);
        throw new Error('Tenant not found.');
    }

    const plan = await Plan.findOne({ name: tenant.plan });
    
    // ✅ CRASH PROOF FIX:
    // If plan is missing OR limits are missing, default to 50.
    const maxOrders = plan?.limits?.maxOrdersPerMonth ?? 50; 

    if (maxOrders !== -1) { // If not unlimited
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const ordersThisMonth = await Order.countDocuments({
            tenantId: tenantId,
            createdAt: { $gte: startOfMonth }
        });

        if (ordersThisMonth >= maxOrders) {
            res.status(403);
            throw new Error(`Order limit reached (${maxOrders}/month) for the ${tenant.plan} Plan. Please upgrade.`);
        }
    }
    // ---------------------------------

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

    // Core Validations
    if (!items || items.length === 0) { res.status(400); throw new Error('No order items provided'); }
    if (!expectedPickupDate) { res.status(400); throw new Error('Expected pickup date is required'); }
    if (subTotalAmount === undefined || parseFloat(subTotalAmount) < 0) { res.status(400); throw new Error('Valid subtotal amount is required'); }

    let customerDoc; 
    const providedEmail = customerEmail ? customerEmail.trim().toLowerCase() : undefined;
    const providedPhone = customerPhone ? customerPhone.trim() : null;
    const providedName = customerName ? customerName.trim() : null;
    const providedAddress = customerAddress ? customerAddress.trim() : undefined;

    // Handle Customer Creation/Lookup
    if (customerId) {
        if (!mongoose.Types.ObjectId.isValid(customerId)) {
            res.status(400); throw new Error('Invalid Customer ID format');
        }
        customerDoc = await Customer.findById(customerId);
        if (!customerDoc) { res.status(404); throw new Error('Customer not found.'); }

        let customerWasModified = false;
        if (providedName && providedName !== customerDoc.name) { customerDoc.name = providedName; customerWasModified = true; }
        if (providedPhone && providedPhone !== customerDoc.phone) {
            const existingByPhone = await Customer.findOne({ phone: providedPhone, _id: { $ne: customerDoc._id } });
            if (existingByPhone) { res.status(400); throw new Error('Phone number in use by another customer.'); }
            customerDoc.phone = providedPhone; customerWasModified = true;
        }
        if (providedEmail && providedEmail !== customerDoc.email) {
             const existingByEmail = await Customer.findOne({ email: providedEmail, _id: { $ne: customerDoc._id } });
             if (existingByEmail) { res.status(400); throw new Error('Email in use by another customer.'); }
             customerDoc.email = providedEmail; customerWasModified = true;
        }
        if (providedAddress !== undefined && providedAddress !== customerDoc.address) {
            customerDoc.address = providedAddress; customerWasModified = true;
        }
        if (customerWasModified) await customerDoc.save();
    } else if (providedName && providedPhone) {
        customerDoc = await Customer.findOne({ phone: providedPhone });
        if (customerDoc) { 
            // Update existing found by phone
            customerDoc.name = providedName; 
            if(providedEmail) customerDoc.email = providedEmail;
            if(providedAddress) customerDoc.address = providedAddress;
            await customerDoc.save();
        } else { 
            // Create new
            customerDoc = await Customer.create({
                name: providedName, phone: providedPhone, email: providedEmail,
                address: providedAddress,
                tenantId: tenantId 
            });
        }
    } else {
        res.status(400); throw new Error('Customer Name and Phone are required.');
    }

    const receiptNumber = await generateReceiptNumber(); 
    
    const order = new Order({
        receiptNumber, 
        customer: customerDoc._id, 
        items,
        subTotalAmount: parseFloat(subTotalAmount),
        discountType: discountType || 'none',
        discountValue: parseFloat(discountValue) || 0,
        amountPaid: parseFloat(amountPaid) || 0,
        expectedPickupDate, 
        notes, 
        createdBy: user._id, 
        tenantId: tenantId,      
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
});

const getOrders = asyncHandler(async (req, res) => {
    const { tenantId } = req;
    const { paid, overdue, serviceType, status, receiptNumber, customerName, customerPhone, customerId } = req.query;
    const pageSize = parseInt(req.query.pageSize, 10) || 10;
    const page = parseInt(req.query.page, 10) || 1;
    let query = { tenantId: tenantId };

    if (paid === 'true') query.isFullyPaid = true;
    if (paid === 'false') query.isFullyPaid = { $ne: true };
    if (overdue === 'true') {
        query.expectedPickupDate = { $lt: new Date() };
        query.status = { $nin: ['Completed', 'Cancelled'] };
    }
    if (status) query.status = status;
    if (receiptNumber) query.receiptNumber = { $regex: receiptNumber, $options: 'i' };
    if (serviceType) query['items.serviceType'] = { $regex: serviceType, $options: 'i' };

    if (customerId) {
        if (!mongoose.Types.ObjectId.isValid(customerId)) {
            return res.json({ orders: [], page: 1, pages: 0, totalOrders: 0 }); 
        }
        query.customer = customerId;
    } else if (customerName || customerPhone) {
        let customerSearchQuery = { $or: [] };
        if (customerName) customerSearchQuery.$or.push({ name: { $regex: customerName, $options: 'i' } });
        if (customerPhone) customerSearchQuery.$or.push({ phone: { $regex: customerPhone, $options: 'i' } });
        if (customerSearchQuery.$or.length > 0) {
            const customers = await Customer.find(customerSearchQuery).select('_id').lean();
            if (customers.length > 0) query.customer = { $in: customers.map(c => c._id) };
            else return res.json({ orders: [], page: 1, pages: 0, totalOrders: 0 });
        }
    }

    const count = await Order.countDocuments(query);
    const orders = await Order.find(query)
        .populate('customer', 'name phone email address')
        .populate('createdBy', 'username')
        .sort({ createdAt: -1 })
        .limit(pageSize)
        .skip(pageSize * (page - 1));
    res.json({ orders, page, pages: Math.ceil(count / pageSize), totalOrders: count });
});


const getOrderById = asyncHandler(async (req, res) => {
    const { tenantId } = req;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400); throw new Error('Invalid Order ID format');
    }
    const order = await Order.findOne({ _id: req.params.id, tenantId: tenantId })
        .populate('customer', 'name phone email address')
        .populate('createdBy', 'username');
    if (!order) { res.status(404); throw new Error('Order not found'); }
    res.json(order);
});


const updateOrder = asyncHandler(async (req, res) => {
    const orderId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        res.status(400); throw new Error('Invalid Order ID format');
    }

    const order = await Order.findById(orderId); 
    if (!order) { res.status(404); throw new Error('Order not found'); }

    // Populate customer separately to work with it
    let customerDocForOrder = await Customer.findById(order.customer);


    const {
        items, subTotalAmount, discountType, discountValue,
        amountPaid, status, expectedPickupDate, actualPickupDate, notes,
        customerId, customerDetailsToUpdate
    } = req.body;

    if (customerId && customerId !== order.customer.toString()) { 
        if (!mongoose.Types.ObjectId.isValid(customerId)) {
            res.status(400); throw new Error('Invalid new Customer ID format for re-association.');
        }
        const newCustomerToAssociate = await Customer.findById(customerId);
        if (!newCustomerToAssociate) { res.status(404); throw new Error('Specified new customer for re-association not found.'); }
        order.customer = newCustomerToAssociate._id;
        customerDocForOrder = newCustomerToAssociate; 
    } else if (customerDetailsToUpdate && customerDocForOrder) { 
        let customerWasModified = false;
        const providedEmailUpdate = customerDetailsToUpdate.email ? customerDetailsToUpdate.email.trim().toLowerCase() : undefined;

        if (customerDetailsToUpdate.name && customerDetailsToUpdate.name.trim() !== customerDocForOrder.name) { customerDocForOrder.name = customerDetailsToUpdate.name.trim(); customerWasModified = true; }
        if (customerDetailsToUpdate.phone && customerDetailsToUpdate.phone.trim() !== customerDocForOrder.phone) {
            const existingByPhone = await Customer.findOne({ phone: customerDetailsToUpdate.phone.trim(), _id: { $ne: customerDocForOrder._id } });
            if (existingByPhone) { res.status(400); throw new Error('Updated phone number is already in use by another customer.'); }
            customerDocForOrder.phone = customerDetailsToUpdate.phone.trim(); customerWasModified = true;
        }
        const currentCustomerEmailOnDoc = (customerDocForOrder.email || '').toLowerCase();
        if (providedEmailUpdate !== undefined && providedEmailUpdate !== currentCustomerEmailOnDoc) {
            if (providedEmailUpdate) {
                const existingByEmail = await Customer.findOne({ email: providedEmailUpdate, _id: { $ne: customerDocForOrder._id } });
                if (existingByEmail) { res.status(400); throw new Error('Updated email address is already in use by another customer.'); }
            }
            customerDocForOrder.email = providedEmailUpdate; customerWasModified = true;
        }
        if (customerDetailsToUpdate.address !== undefined && customerDetailsToUpdate.address.trim() !== (customerDocForOrder.address || '')) {
            customerDocForOrder.address = customerDetailsToUpdate.address.trim() === '' ? undefined : customerDetailsToUpdate.address.trim();
            customerWasModified = true;
        }
        if (customerWasModified) {
            console.log("[OrderController - updateOrder] Updating associated customer's details:", customerDocForOrder);
            await customerDocForOrder.save();
        }
    }
  

    if (items !== undefined) order.items = items;
    if (subTotalAmount !== undefined) order.subTotalAmount = parseFloat(subTotalAmount);
    if (discountType !== undefined) order.discountType = discountType;
    if (discountValue !== undefined) order.discountValue = parseFloat(discountValue) || 0;
    if (amountPaid !== undefined) {
        const newAmountPaid = parseFloat(amountPaid);
        if (isNaN(newAmountPaid) || newAmountPaid < 0) { res.status(400); throw new Error("Invalid payment amount provided."); }
        order.amountPaid = newAmountPaid;
    }
    if (expectedPickupDate !== undefined) order.expectedPickupDate = expectedPickupDate;
    if (actualPickupDate !== undefined) order.actualPickupDate = actualPickupDate;
    if (notes !== undefined) order.notes = notes;

    if (status && status !== order.status) {
        order.status = status;
        if (status === 'Ready for Pickup' && !order.notified) {
            const customerToNotify = await Customer.findById(order.customer); 
            if (customerToNotify && (customerToNotify.email || customerToNotify.phone)) {
                const notificationResult = await sendNotification(customerToNotify, 'readyForPickup', order);
                if (notificationResult.sent) { order.notified = true; order.notificationMethod = notificationResult.method; }
                else { order.notificationMethod = 'failed-auto'; console.warn(`[OrderController] Auto 'Ready for Pickup' notification FAILED for ${order.receiptNumber}: ${notificationResult.message}`); }
            } else { order.notificationMethod = 'no-contact-auto'; console.warn(`[OrderController] No contact/customer found for auto-notification: Order ${order.receiptNumber}`); }
        }
    }

    const updatedOrder = await order.save();
    const populatedOrder = await Order.findById(updatedOrder._id).populate('customer', 'name phone email address').populate('createdBy', 'username');
    res.json(populatedOrder);
});


const deleteOrder = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400); throw new Error('Invalid Order ID format');
    }
    const order = await Order.findById(req.params.id);
    if (!order) { res.status(404); throw new Error('Order not found'); }
    await order.deleteOne();
    res.json({ message: 'Order removed successfully' });
});


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


const markOrderAsFullyPaid = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400); throw new Error('Invalid Order ID format');
    }
    const order = await Order.findById(req.params.id);
    if (!order) { res.status(404); throw new Error('Order not found'); }

    if (order.isFullyPaid && order.amountPaid >= order.totalAmount) {
        console.log(`[OrderController] Order ${order.receiptNumber} is already marked as paid and amountPaid covers totalAmount.`);
    } else {
        order.amountPaid = order.totalAmount; // This will trigger pre-save to set isFullyPaid = true
        console.log(`[OrderController] Marking order ${order.receiptNumber} as fully paid. Setting amountPaid to totalAmount: ${order.totalAmount}`);
    }

    const updatedOrder = await order.save();
    const populatedOrder = await Order.findById(updatedOrder._id).populate('customer', 'name phone email address').populate('createdBy', 'username');
    res.json(populatedOrder);
});
// @desc    Mark an order as fully paid
// @route   PUT /api/orders/:id/mark-paid
// @access  Private
const markOrderAsPaid = asyncHandler(async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, tenantId: req.tenantId });

    if (!order) {
        res.status(404);
        throw new Error('Order not found.');
    }
    if (order.isFullyPaid) {
        res.status(400);
        throw new Error('Order is already marked as fully paid.');
    }

    // Set amountPaid to the totalAmount and add the final payment transaction
    const balanceDue = order.totalAmount - order.amountPaid;
    
    // Add a new payment transaction for the remaining balance
    if (balanceDue > 0) {
        order.payments.push({
            amount: balanceDue,
            method: 'Cash', // Or a default/inferred method
            recordedBy: req.user.id,
        });
    }

    // The pre-save hook will recalculate amountPaid from the payments array
    // and then set isFullyPaid to true.
    const updatedOrder = await order.save();
    
    const populatedOrder = await Order.findById(updatedOrder._id)
        .populate('customer', 'name phone email address')
        .populate('createdBy', 'username');

    res.json(populatedOrder);
});

// Add other payment-related controllers here if you build the modal
const recordPartialPayment = asyncHandler(async (req, res) => {
    const { amount, method } = req.body;
    if (!amount || amount <= 0) {
        res.status(400); throw new Error('A valid payment amount is required.');
    }

    const order = await Order.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!order) { res.status(404); throw new Error('Order not found.'); }
    if (order.isFullyPaid) { res.status(400); throw new Error('Order is already fully paid.'); }

    const newTotalPaid = order.amountPaid + parseFloat(amount);
    if (newTotalPaid > order.totalAmount + 0.01) { // Add tolerance
        res.status(400); throw new Error(`Payment of ${amount} exceeds balance due of ${order.totalAmount - order.amountPaid}.`);
    }

    order.payments.push({
        amount: parseFloat(amount),
        method: method || 'Cash',
        recordedBy: req.user.id,
    });

    const updatedOrder = await order.save();
    const populatedOrder = await Order.findById(updatedOrder._id).populate('customer', 'name phone email address').populate('createdBy', 'username');
    res.json(populatedOrder);
});
// @desc    Record a new payment for an order
// @route   POST /api/orders/:id/payments
// @access  Private
const recordPayment = asyncHandler(async (req, res) => {
    // THIS IS WHERE THE ERROR IS HAPPENING
    const { amount, method } = req.body; // Expecting { amount: number, method: string }

    // Add validation
    if (amount === undefined || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        res.status(400);
        throw new Error('A valid, positive payment amount is required.');
    }

    const order = await Order.findOne({ _id: req.params.id, tenantId: req.tenantId });

    if (!order) {
        res.status(404);
        throw new Error('Order not found.');
    }

    // Update the amount paid
    order.amountPaid += parseFloat(amount);

    // Optional: Add a payment history record to the order if you have such a schema
    // if (!order.paymentHistory) order.paymentHistory = [];
    // order.paymentHistory.push({
    //     amount: parseFloat(amount),
    //     method: method || 'Unknown',
    //     date: new Date()
    // });

    // The pre-save hook on the Order model will automatically update isFullyPaid
    const updatedOrder = await order.save();

    res.status(200).json(updatedOrder);
});

export {
    createOrder,
    getOrders,
    getOrderById,
    updateOrder,
    deleteOrder,
    manuallyNotifyCustomer,
    markOrderAsFullyPaid,
    markOrderAsPaid,
    recordPartialPayment,
    recordPayment
};
