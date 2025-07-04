// server/controllers/customerController.js
import mongoose from 'mongoose'; // Import mongoose to use mongoose.Types.ObjectId
import Customer from '../models/Customer.js';
import Order from '../models/Order.js';
import asyncHandler from '../middleware/asyncHandler.js';

// @desc    Create a new customer
// @route   POST /api/customers
// @access  Private (Staff/Admin)
const createCustomer = asyncHandler(async (req, res) => {
    const { name, phone, email, address } = req.body;
     const { tenantId } = req;

    const existingQuery = { tenantId, $or: [{ phone }] };
    if (email) {
        existingQuery.$or.push({ email: email.toLowerCase() });
    }
    const customerExists = await Customer.findOne(existingQuery);
    if (customerExists) {
        res.status(400);
        throw new Error(`A customer with this phone or email already exists in your organization.`);
    }

    const customer = new Customer({
        tenantId,
        name,
        phone,
        email: email ? email.toLowerCase() : undefined,
        address,
        createdBy: req.user.id // If you implement this
    });

    const createdCustomer = await customer.save();
    res.status(201).json(createdCustomer);
});

// @desc    Get all customers (with optional search)
// @route   GET /api/customers
// @access  Private (Staff/Admin)
const getCustomers = asyncHandler(async (req, res) => {
    const { tenantId } = req;
    const { search } = req.query;

    let query = { tenantId: tenantId };

    if (search) {
        query = {
            $and: [
                { tenantId: tenantId }, 
                {
                    $or: [
                        { name: searchRegex },
                        { phone: searchRegex },
                        { email: searchRegex }
                    ]
                }
            ]
        };
    }
    // Basic pagination, can be enhanced
    const pageSize = parseInt(req.query.pageSize, 10) || 20;
    const page = parseInt(req.query.page, 10) || 1;

    const count = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
        .sort({ name: 1 }) // Sort by name
        .limit(pageSize)
        .skip(pageSize * (page - 1));

    res.json({
        customers,
        page,
        pages: Math.ceil(count / pageSize),
        totalCustomers: count
    });
});

// @desc    Get customer by ID
// @route   GET /api/customers/:id
// @access  Private (Staff/Admin)
const getCustomerById = asyncHandler(async (req, res) => {
    const { tenantId } = req;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400); throw new Error('Invalid customer ID format');
    }
    const customer = await Customer.findOne({ _id: req.params.id, tenantId });
    if (customer) {
        res.json(customer);
    } else {
        res.status(404); throw new Error('Customer not found.');
    }
});


// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private (Staff/Admin)
const updateCustomer = asyncHandler(async (req, res) => {
    const { tenantId } = req;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400); throw new Error('Invalid customer ID format');
    }
    const customer = await Customer.findOne({ _id: req.params.id, tenantId });

    if (!customer) {
        res.status(404); throw new Error('Customer not found.');
    }

    const { name, phone, email, address } = req.body;

    if (phone && phone !== customer.phone) {
        const phoneExists = await Customer.findOne({ phone, tenantId, _id: { $ne: customer._id } });
        if (phoneExists) {
            res.status(400); throw new Error(`Another customer with phone number ${phone} already exists.`);
        }
        customer.phone = phone;
    }


    if (email !== undefined && email !== customer.email) { // Check for undefined to allow clearing email
        if (email) { // Only check for duplicates if new email is not empty
            const emailExists = await Customer.findOne({ email: email.toLowerCase(), _id: { $ne: customer._id } });
            if (emailExists) {
                res.status(400);
                throw new Error(`Another customer with email ${email} already exists.`);
            }
            customer.email = email.toLowerCase();
        } else {
            customer.email = undefined; // Set to undefined if cleared, works with sparse index
        }
    }

    if (name !== undefined) customer.name = name;
    if (address !== undefined) customer.address = address;

    const updatedCustomer = await customer.save();
    res.json(updatedCustomer);
});

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private/Admin
const deleteCustomer = asyncHandler(async (req, res) => {
    const { tenantId } = req;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400); throw new Error('Invalid customer ID format');
    }
    const customer = await Customer.findOne({ _id: req.params.id, tenantId });
    if (!customer) {
        res.status(404); throw new Error('Customer not found.');
    }

    const ordersCount = await Order.countDocuments({ customer: customer._id, tenantId });
    if (ordersCount > 0) {
        res.status(400); throw new Error('Cannot delete customer with existing orders. Consider deactivating customers in the future.');
    }

    await customer.deleteOne();
    res.json({ message: 'Customer removed successfully' });
});


export {
    createCustomer,
    getCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
};