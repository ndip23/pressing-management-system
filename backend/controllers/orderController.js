// server/controllers/orderController.js
import mongoose from 'mongoose'; 
import Order from '../models/Order.js';
import Customer from '../models/Customer.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { generateReceiptNumber } from '../utils/generateReceiptNumber.js';
import { sendNotification } from '../services/notificationService.js';

const createOrder = asyncHandler(async (req, res) => {
    const { tenantId, user } = req;

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

    let customerDoc; // This will hold the Mongoose document for the customer
    const providedEmail = customerEmail ? customerEmail.trim().toLowerCase() : undefined;
    const providedPhone = customerPhone ? customerPhone.trim() : null;
    const providedName = customerName ? customerName.trim() : null;
    const providedAddress = customerAddress ? customerAddress.trim() : undefined;


    if (customerId) {
        if (!mongoose.Types.ObjectId.isValid(customerId)) {
            res.status(400); throw new Error('Invalid Customer ID format');
        }
        customerDoc = await Customer.findById(customerId);
        if (!customerDoc) { res.status(404); throw new Error('Customer not found with the provided ID.'); }

        let customerWasModified = false;
        // Update existing customer if details are different
        if (providedName && providedName !== customerDoc.name) { customerDoc.name = providedName; customerWasModified = true; }
        if (providedPhone && providedPhone !== customerDoc.phone) {
            const existingByPhone = await Customer.findOne({ phone: providedPhone, _id: { $ne: customerDoc._id } });
            if (existingByPhone) { res.status(400); throw new Error('This phone number is already in use by another customer.'); }
            customerDoc.phone = providedPhone; customerWasModified = true;
        }
        const currentCustomerEmail = (customerDoc.email || '').toLowerCase(); // Handle null/undefined email
        if (providedEmail !== undefined && providedEmail !== currentCustomerEmail) {
            if (providedEmail) { // Only check for duplicates if new email is not empty
                const existingByEmail = await Customer.findOne({ email: providedEmail, _id: { $ne: customerDoc._id } });
                if (existingByEmail) { res.status(400); throw new Error('This email address is already in use by another customer.'); }
            }
            customerDoc.email = providedEmail; customerWasModified = true;
        }
        if (providedAddress !== undefined && providedAddress !== (customerDoc.address || '')) {
            customerDoc.address = providedAddress === '' ? undefined : providedAddress; // Allow clearing address
            customerWasModified = true;
        }
        if (customerWasModified) {
            console.log("[OrderController - createOrder] Updating existing customer:", customerDoc);
            await customerDoc.save();
        }
    } else if (providedName && providedPhone) {
       
        customerDoc = await Customer.findOne({ phone: providedPhone });
        if (customerDoc) { 
            console.log("[OrderController - createOrder] Found existing customer by phone, updating:", customerDoc);
            let customerWasModified = false;
            if (providedName && providedName !== customerDoc.name) { customerDoc.name = providedName; customerWasModified = true; }
            const currentCustomerEmail = (customerDoc.email || '').toLowerCase();
            if (providedEmail !== undefined && providedEmail !== currentCustomerEmail) {
                if (providedEmail) {
                    const existingByEmail = await Customer.findOne({ email: providedEmail, _id: { $ne: customerDoc._id } });
                    if (existingByEmail) { res.status(400); throw new Error('This email address is already in use by another customer.'); }
                }
                customerDoc.email = providedEmail; customerWasModified = true;
            }
            if (providedAddress !== undefined && providedAddress !== (customerDoc.address || '')) {
                customerDoc.address = providedAddress === '' ? undefined : providedAddress;
                customerWasModified = true;
            }
            if (customerWasModified) await customerDoc.save();
        } else { 
            if (providedEmail) { 
                const existingByEmail = await Customer.findOne({ email: providedEmail });
                if (existingByEmail) { res.status(400); throw new Error('This email address is already in use. Please use a different email or find the customer associated with this email.'); }
            }
            console.log("[OrderController - createOrder] Creating new customer with details:", { name: providedName, phone: providedPhone, email: providedEmail, address: providedAddress });
            customerDoc = await Customer.create({
                name: providedName, phone: providedPhone, email: providedEmail,
                address: providedAddress,
            });
        }
    } else {
        res.status(400); throw new Error('Customer details (Name and Phone) are required if no existing customer ID is provided.');
    }

    const receiptNumber = await generateReceiptNumber();
    const order = new Order({
        receiptNumber, customer: customerDoc._id, items,
        subTotalAmount: parseFloat(subTotalAmount),
        discountType: discountType || 'none',
        discountValue: parseFloat(discountValue) || 0,
        amountPaid: parseFloat(amountPaid) || 0,
        expectedPickupDate, notes, createdBy: req.user.id,
        tenantId: tenantId, 
        createdBy: user.id
    });

    const createdOrder = await order.save();
    const populatedOrder = await Order.findById(createdOrder._id).populate('customer', 'name phone email address').populate('createdBy', 'username');
    res.status(201).json(populatedOrder);
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

export {
    createOrder,
    getOrders,
    getOrderById,
    updateOrder,
    deleteOrder,
    manuallyNotifyCustomer,
    markOrderAsFullyPaid
};