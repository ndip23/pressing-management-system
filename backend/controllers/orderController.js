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
        // totalAmount, // No longer directly taking totalAmount from req.body for creation
        subTotalAmount,  // NEW: Expecting this from frontend
        discountType,    // NEW: Expecting this
        discountValue,   // NEW: Expecting this
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
    // CORRECTED: Validate subTotalAmount instead of totalAmount
    if (subTotalAmount === undefined || parseFloat(subTotalAmount) < 0) {
        res.status(400);
        throw new Error('Valid subtotal amount is required');
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

        if (customer.isModified()) {
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
        subTotalAmount: parseFloat(subTotalAmount), // Pass subTotalAmount
        discountType: discountType || 'none',       // Pass discountType
        discountValue: parseFloat(discountValue) || 0, // Pass discountValue
        // totalAmount and discountAmount will be calculated by the pre-save hook in the Order model
        amountPaid: parseFloat(amountPaid) || 0,
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
    // ... (This function remains largely the same, no direct changes needed for discount system here,
    // as it fetches existing orders where calculations are already done)
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
    // ... (This function remains the same)
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
    const order = await Order.findById(req.params.id).populate('customer');
    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    const {
        items,
        // totalAmount, // No longer directly taking totalAmount from req.body for update
        subTotalAmount,  // NEW: Expecting this for recalculation
        discountType,    // NEW: Expecting this
        discountValue,   // NEW: Expecting this
        amountPaid, status, expectedPickupDate, actualPickupDate, notes, customerId, customerDetailsToUpdate
    } = req.body;

    // ... (customer update logic remains the same, but ensure it's robust if customer details are updated)
    if (customerId && order.customer._id.toString() !== customerId) {
        const newCustomer = await Customer.findById(customerId);
        if (!newCustomer) throw new Error('New customer ID provided but customer not found.');
        order.customer = newCustomer._id;
    } else if (customerDetailsToUpdate && order.customer) {
        const currentCustomer = await Customer.findById(order.customer._id); // Re-fetch for safety if needed
        if(currentCustomer) {
            if (customerDetailsToUpdate.name !== undefined) currentCustomer.name = customerDetailsToUpdate.name;
            if (customerDetailsToUpdate.phone !== undefined && customerDetailsToUpdate.phone !== currentCustomer.phone) {
                 const existingByPhone = await Customer.findOne({ phone: customerDetailsToUpdate.phone, _id: { $ne: currentCustomer._id } });
                 if (existingByPhone) throw new Error('Another customer with this updated phone number already exists.');
                currentCustomer.phone = customerDetailsToUpdate.phone;
            }
            if (customerDetailsToUpdate.email !== undefined && customerDetailsToUpdate.email !== currentCustomer.email) {
                if (customerDetailsToUpdate.email) { // Only check for duplicates if email is not empty
                    const existingByEmail = await Customer.findOne({ email: customerDetailsToUpdate.email, _id: { $ne: currentCustomer._id } });
                    if (existingByEmail) throw new Error('Another customer with this updated email address already exists.');
                }
                currentCustomer.email = customerDetailsToUpdate.email;
            }
            if (customerDetailsToUpdate.address !== undefined) currentCustomer.address = customerDetailsToUpdate.address;

            if(currentCustomer.isModified()){
                await currentCustomer.save();
            }
        }
    }
    // --- End Customer Update Logic ---


    if (items !== undefined) order.items = items;

    // CORRECTED: Update fields that trigger recalculation in the model
    if (subTotalAmount !== undefined) order.subTotalAmount = parseFloat(subTotalAmount);
    if (discountType !== undefined) order.discountType = discountType; // Should be 'none', 'percentage', or 'fixed'
    if (discountValue !== undefined) order.discountValue = parseFloat(discountValue) || 0;

    // `totalAmount` and `discountAmount` will be recalculated by the Order model's pre-save hook
    // So, we do not set `order.totalAmount = totalAmount` from req.body here.

    if (amountPaid !== undefined) order.amountPaid = parseFloat(amountPaid);
    if (expectedPickupDate !== undefined) order.expectedPickupDate = expectedPickupDate;
    if (actualPickupDate !== undefined) order.actualPickupDate = actualPickupDate;
    if (notes !== undefined) order.notes = notes;

    // ... (status update and notification logic remains the same) ...
    if (status && status !== order.status) {
        order.status = status;
        if (status === 'Ready for Pickup' && !order.notified) {
            // Ensure order.customer is populated or re-fetch if necessary for notification
            // The .populate('customer') at the start of the function should suffice if customerId isn't changed.
            // If customerId *can* change, you might need to re-populate or fetch the new customer.
            const customerForNotification = await Customer.findById(order.customer); // Good to re-fetch if customer could have changed
            if (customerForNotification) {
                if (customerForNotification.email || customerForNotification.phone) {
                    console.log(`[OrderController] Order ${order.receiptNumber} is 'Ready for Pickup'. Attempting automated notification for customer ${customerForNotification.name}.`);
                    const notificationResult = await sendNotification(
                        customerForNotification,
                        'readyForPickup',
                        order
                    );
                    if (notificationResult.sent) {
                        order.notified = true;
                        order.notificationMethod = notificationResult.method;
                    } else {
                        order.notificationMethod = 'failed-auto';
                        console.warn(`[OrderController] Automated 'Ready for Pickup' notification FAILED for order ${order.receiptNumber}: ${notificationResult.message}`);
                    }
                } else {
                    console.warn(`[OrderController] Cannot send 'Ready for Pickup' notification for order ${order.receiptNumber}: Customer ${customerForNotification.name} has no email or phone.`);
                    order.notificationMethod = 'no-contact-auto';
                }
            } else {
                console.warn(`[OrderController] Cannot send 'Ready for Pickup' notification for order ${order.receiptNumber}: Customer record not found for ID ${order.customer}.`);
                order.notificationMethod = 'no-customer-auto';
            }
        }
    }


    const updatedOrder = await order.save(); // This will trigger the pre-save hook in Order model
    const populatedOrder = await Order.findById(updatedOrder._id).populate('customer', 'name phone email address').populate('createdBy', 'username');
    res.json(populatedOrder);
});

// @desc    Delete an order
// @route   DELETE /api/orders/:id
// @access  Private/Admin
const deleteOrder = asyncHandler(async (req, res) => {
    // ... (This function remains the same)
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
    // ... (This function remains the same, ensuring it passes 'manualReminder' or similar to sendNotification)
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
        const errorMessage = notificationResult.message || 'Failed to send manual notification. Check server logs and customer contact details.';
        console.error(`[OrderController] Manual notification FAILED for order ${order.receiptNumber}: ${errorMessage}`);
        res.status(500);
        throw new Error(errorMessage);
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