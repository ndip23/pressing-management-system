// server/controllers/customerController.js
import mongoose from 'mongoose';
import Customer from '../models/Customer.js';
import Order from '../models/Order.js';
import asyncHandler from '../middleware/asyncHandler.js';

// @desc    Create a new customer for the current tenant
// @route   POST /api/customers
// @access  Private
const createCustomer = asyncHandler(async (req, res) => {
    const { name, phone, email, address } = req.body;
    const { tenantId, user } = req;

    if (!name || !phone) {
        res.status(400); throw new Error('Customer name and phone number are required.');
    }

    // Check for existing customer with the same phone OR email within the same tenant
    const existingQuery = { tenantId, $or: [{ phone }] };
    if (email) {
        existingQuery.$or.push({ email: email.toLowerCase() });
    }
    const customerExists = await Customer.findOne(existingQuery);
    if (customerExists) {
        res.status(400); throw new Error(`A customer with this phone or email already exists in your organization.`);
    }

    const customer = new Customer({
        tenantId,
        name,
        phone,
        email: email ? email.toLowerCase() : undefined,
        address,
        // createdBy: user.id // Uncomment if you add this field to your Customer model
    });

    const createdCustomer = await customer.save();
    res.status(201).json(createdCustomer);
});

// @desc    Get all customers for the current tenant (with search and pagination)
// @route   GET /api/customers
// @access  Private
const getCustomers = asyncHandler(async (req, res) => {
    const { tenantId } = req;
    const { search, page = 1, pageSize = 10 } = req.query; // Default page and pageSize
    const query = { tenantId: tenantId };

    if (search) {
        const searchRegex = new RegExp(search, 'i');
        query.$or = [
            { name: searchRegex },
            { phone: searchRegex },
            { email: searchRegex }
        ];
    }

    const limit = parseInt(pageSize, 10);
    const skip = (parseInt(page, 10) - 1) * limit;

    const totalCustomers = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
        .sort({ name: 1 })
        .limit(limit)
        .skip(skip)
        .lean(); // Use .lean() for faster read-only queries

    res.json({
        customers,
        page: parseInt(page, 10),
        pages: Math.ceil(totalCustomers / limit),
        totalCustomers
    });
    console.log(`[getCustomers] Fetching for tenantId: ${req.tenantId}`);
    console.log(`[getCustomers] Found ${customers.length} customers.`);
});

// @desc    Get customer by ID for the current tenant
// @route   GET /api/customers/:id
// @access  Private
const getCustomerById = asyncHandler(async (req, res) => {
    const { tenantId } = req;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400); throw new Error('Invalid customer ID format');
    }
    const customer = await Customer.findOne({ _id: req.params.id, tenantId: tenantId });
    if (customer) {
        res.json(customer);
    } else {
        res.status(404); throw new Error('Customer not found.');
    }
});

// @desc    Update customer for the current tenant
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = asyncHandler(async (req, res) => {
    const { tenantId } = req;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400); throw new Error('Invalid customer ID format');
    }
    const customer = await Customer.findOne({ _id: req.params.id, tenantId: tenantId });

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

    if (email !== undefined && email !== customer.email) {
        if (email) {
            const emailExists = await Customer.findOne({ email: email.toLowerCase(), tenantId, _id: { $ne: customer._id } });
            if (emailExists) {
                res.status(400); throw new Error(`Another customer with email ${email} already exists.`);
            }
            customer.email = email.toLowerCase();
        } else {
            customer.email = undefined; // Allow clearing of email
        }
    }

    if (name !== undefined) customer.name = name;
    if (address !== undefined) customer.address = address;

    const updatedCustomer = await customer.save();
    res.json(updatedCustomer);
});

// @desc    Delete customer for the current tenant
// @route   DELETE /api/customers/:id
// @access  Private/Admin
const deleteCustomer = asyncHandler(async (req, res) => {
    const { tenantId } = req;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400); throw new Error('Invalid customer ID format');
    }
    const customer = await Customer.findOne({ _id: req.params.id, tenantId: tenantId });
    if (!customer) {
        res.status(404); throw new Error('Customer not found.');
    }

    const ordersCount = await Order.countDocuments({ customer: customer._id, tenantId: tenantId });
    if (ordersCount > 0) {
        res.status(400); throw new Error('Cannot delete customer with existing orders. Please reassign or delete their orders first.');
    }

    await customer.deleteOne();
    res.json({ message: 'Customer removed successfully' });
});

export { createCustomer, getCustomers, getCustomerById, updateCustomer, deleteCustomer };