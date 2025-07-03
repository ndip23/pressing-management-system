// server/controllers/publicController.js
import asyncHandler from '../middleware/asyncHandler.js';
import mongoose from 'mongoose';
import Tenant from '../models/Tenant.js';
import User from '../models/User.js';
import Settings from '../models/Settings.js';
import Price from '../models/Price.js';
import generateToken from '../utils/generateToken.js';

// @desc    Register a new tenant with full initial setup data
// @route   POST /api/public/register-with-setup
// @access  Public
const registerTenantWithSetup = asyncHandler(async (req, res) => {
    const {
        adminUser,      // { username, password, email (optional) }
        companyInfo,    // { name, address, phone }
        currencySymbol,
        itemTypes,      // ['Shirt', 'Trousers', ...]
        serviceTypes,   // ['Wash', 'Iron Only', ...]
        priceList       // [{ itemType: 'Shirt', serviceType: 'Wash', price: 500 }, ...]
    } = req.body;

    // --- Validation ---
    if (!adminUser || !companyInfo || !priceList || !itemTypes || !serviceTypes) {
        res.status(400);
        throw new Error('Missing required setup information sections.');
    }
    if (!companyInfo.name || !adminUser.username || !adminUser.password) {
        res.status(400);
        throw new Error('Business name, admin username, and password are required.');
    }
    if (adminUser.password.length < 6) {
        res.status(400);
        throw new Error('Password must be at least 6 characters long.');
    }
    if (itemTypes.length === 0 || serviceTypes.length === 0) {
        res.status(400);
        throw new Error('You must define at least one item type and one service type.');
    }

    const businessExists = await Tenant.findOne({ name: companyInfo.name });
    if (businessExists) {
        res.status(400);
        throw new Error('A business with this name already exists. Please choose another name.');
    }

    // A robust system should make email globally unique for password resets, etc.
    const initialUserExists = await User.findOne({ username: adminUser.username.toLowerCase() });
    if (initialUserExists) {
        res.status(400);
        throw new Error('This admin username is already taken. Please choose another.');
    }
    if (adminUser.email) {
        const emailExists = await User.findOne({ email: adminUser.email.toLowerCase() });
         if (emailExists) {
            res.status(400);
            throw new Error('This email address is already in use by another account.');
        }
    }
    // --- End Validation ---

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Step 1: Create the new Tenant
        const tenant = new Tenant({
            name: companyInfo.name,
            // You can add more tenant-level fields here later (plan, etc.)
        });
        const savedTenant = await tenant.save({ session });
        const tenantId = savedTenant._id;

        // Step 2: Create the first admin User for this tenant
        const user = new User({
            tenantId,
            username: adminUser.username.toLowerCase(),
            password: adminUser.password, // Password will be hashed by pre-save hook
            email: adminUser.email ? adminUser.email.toLowerCase() : undefined,
            role: 'admin', // First user of a tenant is always an admin
        });
        const savedUser = await user.save({ session });


        // Step 3: Create the Settings document for this tenant
        // Note: The post-save hook on Tenant model already does this, but doing it here
        // gives us more control to add all setup data at once. To avoid conflict,
        // you might remove the post-save hook from Tenant.js if using this approach.
        // Let's assume we removed the hook for this more explicit method.
        await Settings.create([{
            tenantId,
            companyInfo,
            defaultCurrencySymbol: currencySymbol || '$',
            itemTypes: itemTypes || [],
            serviceTypes: serviceTypes || [],
        }], { session });

        // Step 4: Create the initial Price List for this tenant
        if (priceList && priceList.length > 0) {
            const pricesToInsert = priceList.map(p => ({
                ...p,
                tenantId, // Add tenantId to each price entry
            }));
            await Price.insertMany(pricesToInsert, { session });
        }

        // If all operations succeed, commit the transaction
        await session.commitTransaction();

        // Step 5: Generate a token and respond to log the user in automatically
        const token = generateToken(savedUser._id, savedUser.username, savedUser.role, savedUser.tenantId);

        res.status(201).json({
            _id: savedUser._id,
            username: savedUser.username,
            role: savedUser.role,
            tenantId: savedUser.tenantId,
            token: token,
            message: `Business '${tenant.name}' registered successfully!`
        });

    } catch (error) {
        // If any operation fails, abort the entire transaction
        await session.abortTransaction();
        console.error("Tenant Registration Transaction Failed:", error);
        
        // Don't leak detailed database errors to the client
        // Provide a generic error or specific validation messages if applicable
        if (error.code === 11000) { // Duplicate key error
             res.status(400).send({ message: 'A business with this name or a user with this username/email already exists.' });
        } else {
             res.status(500).send({ message: 'Server error during registration. Please try again later.' });
        }
    } finally {
        // End the session
        session.endSession();
    }
});

export { registerTenantWithSetup };