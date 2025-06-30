// server/controllers/publicController.js
import asyncHandler from '../middleware/asyncHandler.js';
import Tenant from '../models/Tenant.js';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import mongoose from 'mongoose';

// @desc    Register a new tenant and their first admin user
// @route   POST /api/public/register
// @access  Public
const registerTenant = asyncHandler(async (req, res) => {
    const { businessName, username, password, email } = req.body;

    if (!businessName || !username || !password) {
        res.status(400); throw new Error('Please provide business name, admin username, and password.');
    }

    const businessExists = await Tenant.findOne({ name: businessName });
    if (businessExists) {
        res.status(400); throw new Error('A business with this name already exists.');
    }

    // A more robust check for globally unique admin username/email on first signup
    const initialUserExists = await User.findOne({ username: username.toLowerCase() });
    if (initialUserExists) {
        res.status(400); throw new Error('This admin username is already taken globally.');
    }


    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Create the new Tenant
        const tenant = new Tenant({ name: businessName });
        await tenant.save({ session }); // The post-save hook will create settings

        // 2. Create the first admin user for this tenant
        const user = new User({
            tenantId: tenant._id,
            username: username.toLowerCase(),
            password: password,
            email: email, // If email is on User model
            role: 'admin',
        });
        await user.save({ session });

        await session.commitTransaction();

        // 3. Generate a token and log them in
        const token = generateToken(user._id, user.username, user.role, user.tenantId);

        res.status(201).json({
            _id: user._id,
            username: user.username,
            role: user.role,
            tenantId: user.tenantId,
            token: token,
            message: `Business '${tenant.name}' registered successfully!`
        });

    } catch (error) {
        await session.abortTransaction();
        console.error("Tenant Registration Failed:", error);
        // Don't leak detailed error messages, but handle specific cases
        if (error.code === 11000) { // Duplicate key
             res.status(400).send({ message: 'A business with this name or an admin with this username already exists.' });
        } else {
             res.status(500).send({ message: 'Server error during registration.' });
        }
    } finally {
        session.endSession();
    }
});

export { registerTenant };