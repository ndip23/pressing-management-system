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
        totalAmount,
        expectedPickupDate,
        notes,
        amountPaid,
    } = req.body;

    if (!items || items.length === 0) {
        res.status(400);
        throw new Error('No order items provided');
    }
    if (!expectedPickupDate) {
        res.status(400);
        throw new Error('Expected pickup date is required');
    }
    if (totalAmount === undefined || totalAmount < 0) {
        res.status(400);
        throw new Error('Valid total amount is required');
    }

    let customer;
    if (customerId) {
        customer = await Customer.findById(customerId);
        if (!customer) {
            res.status(404);
            throw new Error('Customer not found with the provided ID.');
        }
        // Optionally update existing customer details if provided and different
        if (customerName && customerName !== customer.name) customer.name = customerName;
        if (customerPhone && customerPhone !== customer.phone) {
            // Add validation for phone format if changed and check for duplicates
            const existingByPhone = await Customer.findOne({ phone: customerPhone, _id: { $ne: customer._id } });
            if (existingByPhone) throw new Error('Another customer with this phone number already exists.');
            customer.phone = customerPhone;
        }
        if (customerEmail !== undefined && customerEmail !== customer.email) {
            if (customerEmail) { // Only check for duplicates if email is not empty
                const existingByEmail = await Customer.findOne({ email: customerEmail, _id: { $ne: customer._id } });
                if (existingByEmail) throw new Error('Another customer with this email address already exists.');
            }
            customer.email = customerEmail;
        }
        if (customerAddress !== undefined && customerAddress !== customer.address) customer.address = customerAddress;

        if (customer.isModified()) { // Save only if changes were made
            await customer.save();
        }

    } else if (customerName && customerPhone) {
        customer = await Customer.findOneAndUpdate(
            { phone: customerPhone },
            {
                $setOnInsert: {
                    name: customerName,
                    phone: customerPhone,
                    email: customerEmail || undefined,
                    address: customerAddress || undefined,
                }
            },
            { new: true, upsert: true, runValidators: true }
        );
    } else {
        res.status(400);
        throw new Error('Customer ID or (Customer Name and Phone) are required.');
    }

    const receiptNumber = await generateReceiptNumber();

    const order = new Order({
        receiptNumber,
        customer: customer._id,
        items,
        totalAmount,
        amountPaid: amountPaid || 0,
        expectedPickupDate,
        notes,
        createdBy: req.user.id,
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
    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }
    res.json(order);
});

// @desc    Update an order
// @route   PUT /api/orders/:id
// @access  Private (Staff/Admin)
const updateOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate('customer'); // Populate customer
    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    const { items, totalAmount, amountPaid, status, expectedPickupDate, actualPickupDate, notes, customerId, customerDetailsToUpdate } = req.body;

    // Handle customer change or update
    if (customerId && order.customer._id.toString() !== customerId) {
        const newCustomer = await Customer.findById(customerId);
        if (!newCustomer) throw new Error('New customer ID provided but customer not found.');
        order.customer = newCustomer._id;
    } else if (customerDetailsToUpdate && order.customer) { // Update existing customer details
        const currentCustomer = await Customer.findById(order.customer._id); // Re-fetch to ensure it's the latest
        if(currentCustomer) {
            if (customerDetailsToUpdate.name) currentCustomer.name = customerDetailsToUpdate.name;
            if (customerDetailsToUpdate.phone && customerDetailsToUpdate.phone !== currentCustomer.phone) {
                 const existingByPhone = await Customer.findOne({ phone: customerDetailsToUpdate.phone, _id: { $ne: currentCustomer._id } });
                 if (existingByPhone) throw new Error('Another customer with this updated phone number already exists.');
                currentCustomer.phone = customerDetailsToUpdate.phone;
            }
            if (customerDetailsToUpdate.email !== undefined && customerDetailsToUpdate.email !== currentCustomer.email) {
                if (customerDetailsToUpdate.email) {
                    const existingByEmail = await Customer.findOne({ email: customerDetailsToUpdate.email, _id: { $ne: currentCustomer._id } });
                    if (existingByEmail) throw new Error('Another customer with this updated email address already exists.');
                }
                currentCustomer.email = customerDetailsToUpdate.email;
            }
            if (customerDetailsToUpdate.address !== undefined) currentCustomer.address = customerDetailsToUpdate.address;

            if(currentCustomer.isModified()){
                await currentCustomer.save();
                // order.customer might need to be re-populated or ensure it's just the ID
            }
        }
    }


    if (items !== undefined) order.items = items;
    if (totalAmount !== undefined) order.totalAmount = totalAmount;
    if (amountPaid !== undefined) order.amountPaid = amountPaid;
    if (expectedPickupDate !== undefined) order.expectedPickupDate = expectedPickupDate;
    if (actualPickupDate !== undefined) order.actualPickupDate = actualPickupDate;
    if (notes !== undefined) order.notes = notes;

    if (status && status !== order.status) {
        order.status = status;
        if (status === 'Ready for Pickup' && !order.notified) {
            // Re-populate customer in case it was changed and not populated above
            const customerForNotification = await Customer.findById(order.customer);
            if (customerForNotification && (customerForNotification.email || customerForNotification.phone)) {
                const notificationResult = await sendNotification(
                    customerForNotification,
                    `Your PressFlow Order #${order.receiptNumber} is Ready!`,
                    `Dear ${customerForNotification.name},\n\nYour order #${order.receiptNumber} is now ready for pickup.\n\nPlease collect it at your earliest convenience.\n\nThank you,\nPressFlow Team`,
                    order
                );
                if (notificationResult.sent) {
                    order.notified = true;
                    order.notificationMethod = notificationResult.method;
                }
            } else {
                console.warn(`Cannot send notification for order ${order.receiptNumber}: Customer details for notification not available or customer has no contact info.`);
            }
        } else if (status !== 'Ready for Pickup' && order.notified) {
            // Optional: Reset notification status if order is moved back from 'Ready'
            // order.notified = false;
            // order.notificationMethod = 'none';
        }
    }

    const updatedOrder = await order.save();
    // Repopulate to ensure all refs are fresh, especially if customer was updated
    const populatedOrder = await Order.findById(updatedOrder._id).populate('customer', 'name phone email address').populate('createdBy', 'username');
    res.json(populatedOrder);
});

// @desc    Delete an order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
const deleteOrder = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }
    await order.deleteOne();
    res.json({ message: 'Order removed' });
});


// @desc    Manually trigger a notification for an order
// @route   POST /api/orders/:id/notify
// @access  Private (Staff/Admin)
const manuallyNotifyCustomer = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate('customer');

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }
    if (!order.customer) {
        res.status(400);
        throw new Error('Customer details not found for this order. Cannot send notification.');
    }
    if (!order.customer.email && !order.customer.phone) {
        res.status(400);
        throw new Error('Customer has no email or phone number on file. Cannot send notification.');
    }

    const subject = `Reminder: Your PressFlow Order #${order.receiptNumber} is Ready!`;
    const messageBody = `Dear ${order.customer.name},\n\nThis is a reminder that your order #${order.receiptNumber} is ready for pickup.\n\nPlease collect it at your earliest convenience.\n\nThank you,\nPressFlow Team`;

    const notificationResult = await sendNotification(
        order.customer,
        subject,
        messageBody,
        order
    );

    if (notificationResult.sent) {
        order.notified = true;
        order.notificationMethod = notificationResult.method; // Could be 'manual-' + method
        await order.save();
        // Send back the updated order
        const populatedOrder = await Order.findById(order._id).populate('customer', 'name phone email address').populate('createdBy', 'username');
        res.json({ message: `Notification sent successfully via ${notificationResult.method}.`, order: populatedOrder });
    } else {
        res.status(500);
        throw new Error('Failed to send notification. Please check customer contact details and server logs.');
    }
});


export {
    createOrder,
    getOrders,
    getOrderById,
    updateOrder,
    deleteOrder,
    manuallyNotifyCustomer,
};