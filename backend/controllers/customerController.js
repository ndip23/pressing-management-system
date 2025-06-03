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

    if (!name || !phone) {
        res.status(400);
        throw new Error('Customer name and phone number are required.');
    }

    const phoneExists = await Customer.findOne({ phone });
    if (phoneExists) {
        res.status(400);
        throw new Error(`Customer with phone number ${phone} already exists.`);
    }

    if (email) {
        const emailExists = await Customer.findOne({ email: email.toLowerCase() });
        if (emailExists) {
            res.status(400);
            throw new Error(`Customer with email ${email} already exists.`);
        }
    }

    const customer = new Customer({
        name,
        phone,
        email: email ? email.toLowerCase() : undefined,
        address,
        // createdBy: req.user.id // If you implement this
    });

    const createdCustomer = await customer.save();
    res.status(201).json(createdCustomer);
});

// @desc    Get all customers (with optional search)
// @route   GET /api/customers
// @access  Private (Staff/Admin)
const getCustomers = asyncHandler(async (req, res) => {
    const { search } = req.query;
    let query = {};

    if (search) {
        const searchRegex = new RegExp(search, 'i');
        query = {
            $or: [
                { name: searchRegex },
                { phone: searchRegex },
                { email: searchRegex }
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
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400);
        throw new Error('Invalid customer ID format');
    }
    const customer = await Customer.findById(req.params.id);
    if (customer) {
        res.json(customer);
    } else {
        res.status(404);
        throw new Error('Customer not found');
    }
});

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private (Staff/Admin)
const updateCustomer = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400);
        throw new Error('Invalid customer ID format');
    }
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
        res.status(404);
        throw new Error('Customer not found');
    }

    const { name, phone, email, address } = req.body;

    if (phone && phone !== customer.phone) {
        const phoneExists = await Customer.findOne({ phone, _id: { $ne: customer._id } });
        if (phoneExists) {
            res.status(400);
            throw new Error(`Another customer with phone number ${phone} already exists.`);
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
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400);
        throw new Error('Invalid customer ID format');
    }
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
        res.status(404);
        throw new Error('Customer not found');
    }

    const ordersCount = await Order.countDocuments({ customer: customer._id });
    if (ordersCount > 0) {
        res.status(400);
        throw new Error('Cannot delete customer with existing orders. Please reassign or delete their orders first.');
        // Consider an "archive" or "deactivate" feature for customers instead of hard delete if they have orders.
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