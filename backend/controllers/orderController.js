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

    if (!items || items.length === 0) { res.status(400); throw new Error('No order items provided'); }
    if (!expectedPickupDate) { res.status(400); throw new Error('Expected pickup date is required'); }
    if (subTotalAmount === undefined || parseFloat(subTotalAmount) < 0) { res.status(400); throw new Error('Valid subtotal amount is required'); }

    let customerDoc;
    const providedEmail = customerEmail ? customerEmail.trim().toLowerCase() : undefined;

    if (customerId) {
        customerDoc = await Customer.findById(customerId);
        if (!customerDoc) { res.status(404); throw new Error('Customer not found with the provided ID.'); }
        let customerWasModified = false;
        if (customerName && customerName.trim() !== customerDoc.name) { customerDoc.name = customerName.trim(); customerWasModified = true; }
        if (customerPhone && customerPhone.trim() !== customerDoc.phone) {
            const existingByPhone = await Customer.findOne({ phone: customerPhone.trim(), _id: { $ne: customerDoc._id } });
            if (existingByPhone) { res.status(400); throw new Error('This phone number is already in use by another customer.'); }
            customerDoc.phone = customerPhone.trim(); customerWasModified = true;
        }
        const currentCustomerEmail = (customerDoc.email || '').toLowerCase();
        if (providedEmail !== undefined && providedEmail !== currentCustomerEmail) {
            if (providedEmail) {
                const existingByEmail = await Customer.findOne({ email: providedEmail, _id: { $ne: customerDoc._id } });
                if (existingByEmail) { res.status(400); throw new Error('This email address is already in use by another customer.'); }
            }
            customerDoc.email = providedEmail; customerWasModified = true;
        }
        if (customerAddress !== undefined && customerAddress.trim() !== (customerDoc.address || '')) { customerDoc.address = customerAddress.trim(); customerWasModified = true; }
        if (customerWasModified) await customerDoc.save();
    } else if (customerName && customerPhone) {
        const phoneToSearch = customerPhone.trim();
        let existingCustomerByPhone = await Customer.findOne({ phone: phoneToSearch });
        if (existingCustomerByPhone) {
            customerDoc = existingCustomerByPhone;
            let customerWasModified = false;
            if (customerName && customerName.trim() !== customerDoc.name) { customerDoc.name = customerName.trim(); customerWasModified = true; }
            const currentCustomerEmail = (customerDoc.email || '').toLowerCase();
            if (providedEmail !== undefined && providedEmail !== currentCustomerEmail) {
                if (providedEmail) {
                    const existingByEmail = await Customer.findOne({ email: providedEmail, _id: { $ne: customerDoc._id } });
                    if (existingByEmail) { res.status(400); throw new Error('This email address is already in use by another customer.'); }
                }
                customerDoc.email = providedEmail; customerWasModified = true;
            }
            if (customerAddress !== undefined && customerAddress.trim() !== (customerDoc.address || '')) { customerDoc.address = customerAddress.trim(); customerWasModified = true; }
            if (customerWasModified) await customerDoc.save();
        } else {
            if (providedEmail) {
                const existingByEmail = await Customer.findOne({ email: providedEmail });
                if (existingByEmail) { res.status(400); throw new Error('This email address is already in use. Please use a different email or find the customer associated with this email.'); }
            }
            customerDoc = await Customer.create({
                name: customerName.trim(), phone: phoneToSearch, email: providedEmail,
                address: customerAddress ? customerAddress.trim() : undefined,
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
    });

    const createdOrder = await order.save();
    const populatedOrder = await Order.findById(createdOrder._id).populate('customer', 'name phone email address').populate('createdBy', 'username');
    res.status(201).json(populatedOrder);
});

// @desc    Get all orders (with filtering and pagination)
// @route   GET /api/orders
// @access  Private (Staff/Admin)
const getOrders = asyncHandler(async (req, res) => {
    const { paid, overdue, customerName, serviceType, status, receiptNumber, customerPhone, customerId } = req.query;
    const pageSize = parseInt(req.query.pageSize, 10) || 10;
    const page = parseInt(req.query.page, 10) || 1;
    let query = {};
    let customerQuery = {};

    if (paid === 'true') query.isFullyPaid = true;
    if (paid === 'false') query.isFullyPaid = { $ne: true };
    if (overdue === 'true') {
        query.expectedPickupDate = { $lt: new Date() };
        query.status = { $nin: ['Completed', 'Cancelled'] };
    }
    if (status) query.status = status;
    if (receiptNumber) query.receiptNumber = { $regex: receiptNumber, $options: 'i' };
    if (customerId) customerQuery._id = customerId;
    if (customerName) customerQuery.name = { $regex: customerName, $options: 'i' };
    if (customerPhone) customerQuery.phone = { $regex: customerPhone, $options: 'i' };

    if (Object.keys(customerQuery).length > 0) {
        const customers = await Customer.find(customerQuery).select('_id');
        if (customers.length > 0) {
            query.customer = { $in: customers.map(c => c._id) };
        } else {
            return res.json({ orders: [], page, pages: 0, totalOrders: 0 });
        }
    }
    if (serviceType) query['items.serviceType'] = { $regex: serviceType, $options: 'i' };

    const count = await Order.countDocuments(query);
    const orders = await Order.find(query)
        .populate('customer', 'name phone email address')
        .populate('createdBy', 'username')
        .sort({ createdAt: -1 })
        .limit(pageSize)
        .skip(pageSize * (page - 1));
    res.json({ orders, page, pages: Math.ceil(count / pageSize), totalOrders: count });
});

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private (Staff/Admin)
const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('customer', 'name phone email address')
        .populate('createdBy', 'username');
    if (!order) { res.status(404); throw new Error('Order not found'); }
    res.json(order);
});

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

    let customerDocForOrder = order.customer;
    if (customerId && customerDocForOrder?._id.toString() !== customerId) {
        const newCustomerToAssociate = await Customer.findById(customerId);
        if (!newCustomerToAssociate) { res.status(404); throw new Error('Specified new customer ID not found.'); }
        customerDocForOrder = newCustomerToAssociate;
        order.customer = customerDocForOrder._id;
    }

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
        if (customerModified) await customerDocForOrder.save();
    }

    if (items !== undefined) order.items = items;
    if (subTotalAmount !== undefined) order.subTotalAmount = parseFloat(subTotalAmount);
    if (discountType !== undefined) order.discountType = discountType;
    if (discountValue !== undefined) order.discountValue = parseFloat(discountValue) || 0;
    if (amountPaid !== undefined) order.amountPaid = parseFloat(amountPaid);
    if (expectedPickupDate !== undefined) order.expectedPickupDate = expectedPickupDate;
    if (actualPickupDate !== undefined) order.actualPickupDate = actualPickupDate;
    if (notes !== undefined) order.notes = notes;

    if (status && status !== order.status) {
        order.status = status;
        if (status === 'Ready for Pickup' && !order.notified) {
            const customerForNotification = await Customer.findById(order.customer);
            if (customerForNotification && (customerForNotification.email || customerForNotification.phone)) {
                const notificationResult = await sendNotification(customerForNotification, 'readyForPickup', order);
                if (notificationResult.sent) { order.notified = true; order.notificationMethod = notificationResult.method; }
                else { order.notificationMethod = 'failed-auto'; console.warn(`[OrderController] Auto 'Ready for Pickup' notification FAILED for ${order.receiptNumber}: ${notificationResult.message}`); }
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
const deleteOrder = asyncHandler(async (req, res) => { // <<<< DEFINITION OF deleteOrder
    const order = await Order.findById(req.params.id);
    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }
    // Add any business logic before deletion if necessary
    // For example, prevent deletion of orders that are not 'Completed' or 'Cancelled'
    // if (!['Completed', 'Cancelled'].includes(order.status)) {
    //    res.status(400);
    //    throw new Error('Order cannot be deleted unless it is Completed or Cancelled.');
    // }
    await order.deleteOne(); // Mongoose v6+
    res.json({ message: 'Order removed successfully' });
});

// @desc    Manually trigger a notification for an order
// @route   POST /api/orders/:id/notify
// @access  Private (Staff/Admin)
const manuallyNotifyCustomer = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate('customer');
    if (!order) { res.status(404); throw new Error('Order not found'); }
    if (!order.customer) { res.status(400); throw new Error('Customer details not found for this order.'); }
    if (!order.customer.email && !order.customer.phone) { res.status(400); throw new Error('Customer has no email or phone number on file.');}

    console.log(`[OrderController] Attempting manual notification for order ${order.receiptNumber} to customer ${order.customer.name}.`);
    const notificationResult = await sendNotification( order.customer, 'manualReminder', order );

    if (notificationResult.sent) {
        order.notified = true;
        order.notificationMethod = `manual-${notificationResult.method}`;
        await order.save();
        const populatedOrder = await Order.findById(order._id).populate('customer', 'name phone email address').populate('createdBy', 'username');
        res.json({ message: `Notification successfully sent via ${notificationResult.method}.`, order: populatedOrder });
    } else {
        const errorMessage = notificationResult.message || 'Failed to send manual notification. Check server logs.';
        console.error(`[OrderController] Manual notification FAILED for order ${order.receiptNumber}: ${errorMessage}`);
        res.status(500).json({ message: errorMessage }); // Send error message in JSON
    }
});



export { // <<<< EXPORT BLOCK
    createOrder,
    getOrders,
    getOrderById,
    updateOrder,
    deleteOrder, // Ensure deleteOrder is listed here
    manuallyNotifyCustomer,
};