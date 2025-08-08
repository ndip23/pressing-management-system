// server/controllers/publicController.js
import asyncHandler from '../middleware/asyncHandler.js';
import mongoose from 'mongoose';
import { customAlphabet } from 'nanoid';
import PendingUser from '../models/PendingUser.js';
import Tenant from '../models/Tenant.js';
import User from '../models/User.js';
import Settings from '../models/Settings.js';
import Price from '../models/Price.js';
import { sendOtpEmail } from '../services/notificationService.js';
import generateToken from '../utils/generateToken.js';

// --- STEP 1: INITIATE REGISTRATION & SEND OTP ---
const initiateRegistration = asyncHandler(async (req, res) => {
    const registrationData = req.body;
    const { adminUser, companyInfo } = registrationData;

    // --- Validation ---
    if (!adminUser?.email || !/^\S+@\S+\.\S+$/.test(adminUser.email)) { res.status(400); throw new Error('A valid email address is required.'); }
    if (!companyInfo?.name || !adminUser?.username || !adminUser?.password) { res.status(400); throw new Error('Business name, admin username, and password are required.'); }
    if (adminUser.password.length < 6) { res.status(400); throw new Error('Password must be at least 6 characters long.'); }

    const userExists = await User.findOne({ $or: [{ email: adminUser.email.toLowerCase() }, { username: adminUser.username.toLowerCase() }] });
    if (userExists) { res.status(400); throw new Error('A user with this email or username already exists.'); }

    const businessExists = await Tenant.findOne({ name: companyInfo.name });
    if (businessExists) { res.status(400); throw new Error('A business with this name already exists.'); }

    await PendingUser.deleteOne({ email: adminUser.email.toLowerCase() });

    const nanoid = customAlphabet('1234567890', 6);
    const otp = nanoid();

    // The pre-save hook in PendingUser model will hash the OTP
    const pendingUser = new PendingUser({
        email: adminUser.email.toLowerCase(),
        otpHash: otp, // Pass the plaintext OTP here; the model will hash it
        signupData: registrationData,
    });
    await pendingUser.save();

    try {
        await sendOtpEmail(adminUser.email, otp);
    } catch (emailError) {
        console.error(`[PublicCtrl] FAILED to send OTP email to ${adminUser.email}:`, emailError);
        res.status(500); throw new Error("Could not send verification email. Please check the address and try again.");
    }

    res.status(200).json({ message: `A verification code has been sent to ${adminUser.email}.` });
});

// --- STEP 2: VERIFY OTP & FINALIZE REGISTRATION ---
const finalizeRegistration = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) { res.status(400); throw new Error('Email and OTP are required.'); }

    const pendingUser = await PendingUser.findOne({ email: email.toLowerCase() });

    if (!pendingUser) { res.status(400); throw new Error('Invalid registration request or it has expired. Please start over.'); }
    // The expireAt field in the model handles automatic deletion, but this is a good manual check
    if (new Date() > pendingUser.expireAt) {
        await pendingUser.deleteOne(); // Clean up expired entry
        res.status(400); throw new Error('Your OTP has expired. Please start the registration over.');
    }

    const isMatch = await pendingUser.matchOtp(otp);
    if (!isMatch) { res.status(400); throw new Error('Invalid verification code.'); }

    const { adminUser, companyInfo, currencySymbol, itemTypes, serviceTypes, priceList } = pendingUser.signupData;

    if (!adminUser || !companyInfo) {
        throw new Error("Internal Server Error: Pending registration data is incomplete.");
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const tenant = new Tenant({ name: companyInfo.name, /* ... other tenant fields from companyInfo if any ... */ });
        const savedTenant = await tenant.save({ session });
        const tenantId = savedTenant._id;

        const user = new User({
            tenantId,
            username: adminUser.username.toLowerCase(),
            password: adminUser.password, // Will be hashed by User model's pre-save hook
            email: adminUser.email.toLowerCase(),
            role: 'admin',
        });
        const savedUser = await user.save({ session });

        // The post('save') hook on Tenant model will create settings, so this is redundant and can be removed
        // await Settings.create([{ tenantId, companyInfo, defaultCurrencySymbol, itemTypes, serviceTypes }], { session });
        // Instead, let's update the settings that the hook created
        await Settings.findOneAndUpdate(
            { tenantId: tenantId },
            {
                $set: {
                    companyInfo: companyInfo,
                    defaultCurrencySymbol: currencySymbol,
                    itemTypes: itemTypes,
                    serviceTypes: serviceTypes
                }
            },
            { session }
        );


        if (priceList && priceList.length > 0) {
            await Price.insertMany(priceList.map(p => ({ ...p, tenantId })), { session });
        }

        await pendingUser.deleteOne({ session });
        await session.commitTransaction();

        const token = generateToken(savedUser._id, savedUser.username, savedUser.role, savedUser.tenantId);
        res.status(201).json({
            _id: savedUser._id, username: savedUser.username, role: savedUser.role,
            tenantId: savedUser.tenantId, token,
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

export {
  initiateRegistration,
  finalizeRegistration,
  getPublicDirectory,
  getBusinessBySlug
};