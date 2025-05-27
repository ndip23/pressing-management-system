// server/controllers/customerController.js
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

    const customerExists = await Customer.findOne({ phone });
    if (customerExists) {
        res.status(400);
        throw new Error('Customer with this phone number already exists.');
    }
    if (email) {
        const emailExists = await Customer.findOne({ email });
        if (emailExists) {
             res.status(400);
            throw new Error('Customer with this email address already exists.');
        }
    }


    const customer = new Customer({
        name,
        phone,
        email: email || undefined, // Store undefined if empty, so sparse unique index works correctly
        address,
        // createdBy: req.user.id // If tracking who created the customer
    });

    const createdCustomer = await customer.save();
    res.status(201).json(createdCustomer);
});

// @desc    Get all customers (with optional search/pagination)
// @route   GET /api/customers
// @access  Private (Staff/Admin)
const getCustomers = asyncHandler(async (req, res) => {
    const { search } = req.query; // Example: ?search=John or ?search=5551234
    let query = {};

    if (search) {
        const searchRegex = new RegExp(search, 'i'); // Case-insensitive search
        query = {
            $or: [
                { name: searchRegex },
                { phone: searchRegex },
                { email: searchRegex }
            ]
        };
    }

    // Add pagination later if needed
    // const pageSize = 10;
    // const page = Number(req.query.pageNumber) || 1;
    // const count = await Customer.countDocuments(query);
    // const customers = await Customer.find(query).limit(pageSize).skip(pageSize * (page - 1));
    // res.json({ customers, page, pages: Math.ceil(count / pageSize) });

    const customers = await Customer.find(query).sort({ createdAt: -1 });
    res.json(customers);
});

// @desc    Get customer by ID
// @route   GET /api/customers/:id
// @access  Private (Staff/Admin)
const getCustomerById = asyncHandler(async (req, res) => {
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
    const { name, phone, email, address } = req.body;
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
        res.status(404);
        throw new Error('Customer not found');
    }

    // Check for duplicate phone number if it's being changed
    if (phone && phone !== customer.phone) {
        const existingCustomerWithPhone = await Customer.findOne({ phone });
        if (existingCustomerWithPhone && existingCustomerWithPhone._id.toString() !== customer._id.toString()) {
            res.status(400);
            throw new Error('Another customer with this phone number already exists.');
        }
    }
    // Check for duplicate email if it's being changed
    if (email && email !== customer.email) {
        const existingCustomerWithEmail = await Customer.findOne({ email });
        if (existingCustomerWithEmail && existingCustomerWithEmail._id.toString() !== customer._id.toString()) {
            res.status(400);
            throw new Error('Another customer with this email address already exists.');
        }
    }


    customer.name = name || customer.name;
    customer.phone = phone || customer.phone;
    customer.email = email !== undefined ? email : customer.email; // Allow clearing email
    customer.address = address !== undefined ? address : customer.address;

    const updatedCustomer = await customer.save();
    res.json(updatedCustomer);
});

// @desc    Delete customer (Consider implications: what happens to their orders?)
// @route   DELETE /api/customers/:id
// @access  Private/Admin (Typically admin only for destructive actions)
const deleteCustomer = asyncHandler(async (req, res) => {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
        res.status(404);
        throw new Error('Customer not found');
    }

    // Check if customer has any orders. If so, prevent deletion or anonymize.
    const ordersCount = await Order.countDocuments({ customer: customer._id });
    if (ordersCount > 0) {
        res.status(400);
        throw new Error('Cannot delete customer with existing orders. Consider deactivating or anonymizing instead.');
        // Alternatively, you could implement logic to anonymize customer data on orders.
    }

    await customer.deleteOne(); // Mongoose v6+
    // For older Mongoose: await customer.remove();
    res.json({ message: 'Customer removed' });
});

export {
    createCustomer,
    getCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
};