// server/controllers/publicController.js
import asyncHandler from '../middleware/asyncHandler.js';
import mongoose from 'mongoose';
import { customAlphabet } from 'nanoid';
import { addMinutes } from 'date-fns';
import PendingUser from '../models/PendingUser.js';
import Tenant from '../models/Tenant.js';
import User from '../models/User.js';
import Settings from '../models/Settings.js';
import Price from '../models/Price.js';
import { sendOtpEmail } from '../services/notificationService.js'; // Using a dedicated OTP email function
import generateToken from '../utils/generateToken.js';

// --- STEP 1: INITIATE REGISTRATION & SEND OTP ---
// @desc    Validate signup data, store it temporarily, and send OTP
// @route   POST /api/public/initiate-registration
// @access  Public
const initiateRegistration = asyncHandler(async (req, res) => {
    const registrationData = req.body;
    const { adminUser, companyInfo } = registrationData;

    // --- Perform initial validation ---
    if (!adminUser?.email || !/^\S+@\S+\.\S+$/.test(adminUser.email)) {
        res.status(400);
        throw new Error('A valid email address is required for verification.');
    }
    if (!companyInfo?.name || !adminUser?.username || !adminUser?.password) {
        res.status(400);
        throw new Error('Business name, admin username, and password are required.');
    }
    if (adminUser.password.length < 6) {
        res.status(400);
        throw new Error('Password must be at least 6 characters long.');
    }

    // Check if email or username is already in the main User table or business name in Tenant
    const userExists = await User.findOne({ $or: [{ email: adminUser.email.toLowerCase() }, { username: adminUser.username.toLowerCase() }] });
    if (userExists) { res.status(400); throw new Error('A user with this email or username already exists.'); }

    const businessExists = await Tenant.findOne({ name: companyInfo.name });
    if (businessExists) { res.status(400); throw new Error('A business with this name already exists.'); }
    // --- End Validation ---

    // Remove any previous pending registration for this email to allow retries
    await PendingUser.deleteOne({ email: adminUser.email.toLowerCase() });

    // Generate a 6-digit numeric OTP
    const nanoid = customAlphabet('1234567890', 6);
    const otp = nanoid();

    // Create the pending user document in the temporary collection
    const pendingUser = new PendingUser({
        email: adminUser.email.toLowerCase(),
        otp: otp, // The pre-save hook in PendingUser model will hash this
        otpExpires: addMinutes(new Date(), 15), // OTP expires in 15 minutes
        signupData: registrationData, // Store the entire form payload
    });
    await pendingUser.save();

    // Send the OTP email to the user
    try {
        await sendOtpEmail(adminUser.email, otp);
    } catch (emailError) {
        console.error(`[PublicCtrl] FAILED to send OTP email to ${adminUser.email}:`, emailError);
        res.status(500);
        throw new Error("Could not send verification email. Please check the address and try again.");
    }

    res.status(200).json({ message: `A verification code has been sent to ${adminUser.email}.` });
});


// --- STEP 2: VERIFY OTP & FINALIZE REGISTRATION ---
// @desc    Verify OTP and create the tenant, user, settings, and prices
// @route   POST /api/public/finalize-registration
// @access  Public
const finalizeRegistration = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) { res.status(400); throw new Error('Email and OTP are required.'); }

    const pendingUser = await PendingUser.findOne({ email: email.toLowerCase() });
    if (!pendingUser) { res.status(400); throw new Error('Invalid registration request or it has expired. Please start over.'); }
    if (new Date() > pendingUser.otpExpires) { res.status(400); throw new Error('Your OTP has expired. Please start over.'); }

    const isMatch = await pendingUser.matchOtp(otp);
    if (!isMatch) { res.status(400); throw new Error('Invalid OTP provided.'); }

    const { signupData } = pendingUser;
    // --- CORRECTED DESTRUCTURING ---
    const { adminUser, companyInfo, currencySymbol, itemTypes, serviceTypes, priceList } = signupData;

    // --- SECONDARY VALIDATION ---
    if (!adminUser || !companyInfo || !currencySymbol) {
        console.error("Internal server error: Pending registration data was incomplete for email:", email);
        throw new Error("Internal Server Error: Pending registration data is incomplete.");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const tenant = new Tenant({ name: companyInfo.name });
        const savedTenant = await tenant.save({ session });
        const tenantId = savedTenant._id;

        const user = new User({
            tenantId,
            username: adminUser.username.toLowerCase(),
            password: adminUser.password, // Will be hashed by pre-save hook
            email: adminUser.email.toLowerCase(),
            role: 'admin',
        });
        const savedUser = await user.save({ session });

        // --- CORRECTED VARIABLE NAME USED HERE ---
        await Settings.create([{
            tenantId,
            companyInfo,
            defaultCurrencySymbol: currencySymbol, // Use the destructured variable 'currencySymbol'
            itemTypes,
            serviceTypes
        }], { session });

        if (priceList && priceList.length > 0) {
            await Price.insertMany(priceList.map(p => ({ ...p, tenantId })), { session });
        }

        await pendingUser.deleteOne({ session });
        await session.commitTransaction();

        const token = generateToken(savedUser._id, savedUser.username, savedUser.role, savedUser.tenantId);
        res.status(201).json({
            _id: savedUser._id,
            username: savedUser.username,
            role: savedUser.role,
            tenantId: savedUser.tenantId,
            token,
            message: `Account for '${tenant.name}' created successfully!`
        });

    } catch (error) {
        await session.abortTransaction();
        console.error("Finalize Registration Transaction Failed:", error);
        if (error.code === 11000) { throw new Error('A business, user, or email with these details was registered while you were verifying.'); }
        throw new Error('A server error occurred during final account creation.');
    } finally {
        session.endSession();
    }
});
// @desc    Get a list of publicly listed businesses for the directory
// @route   GET /api/public/directory
// @access  Public
const getPublicDirectory = asyncHandler(async (req, res) => {
    const { city, search } = req.query;
    let query = {
        isActive: true, // Only show active businesses
        isListedInDirectory: true // Only show businesses that opted-in
    };

    if (city) {
        query.city = { $regex: city, $options: 'i' };
    }
    if (search) {
        query.name = { $regex: search, $options: 'i' };
    }

    const tenants = await Tenant.find(query)
        .sort({ name: 1 })
        .select('name publicAddress publicPhone publicEmail city country description logoUrl'); // Only send public fields

    res.json(tenants);
});
const getBusinessBySlug = asyncHandler(async (req, res) => {
    const tenant = await Tenant.findOne({
        slug: req.params.slug,
        isActive: true,
        isListedInDirectory: true,
    }).select('name publicAddress publicPhone publicEmail city country description logoUrl'); // Only public fields

    if (!tenant) {
        res.status(404); throw new Error('Business profile not found.');
    }
    res.json(tenant);
});

// Rename functions to match what your routes and API services expect
export {
  initiateRegistration, finalizeRegistration, getPublicDirectory,getBusinessBySlug
};