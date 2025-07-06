// server/controllers/authController.js
import mongoose from 'mongoose';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Tenant from '../models/Tenant.js';
import generateToken from '../utils/generateToken.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { cloudinary } from '../config/cloudinaryConfig.js'; 

// @desc    Register a new user (for an existing tenant, by an admin)
// @route   POST /api/auth/register
// @access  Private/Admin
const registerUser = asyncHandler(async (req, res) => {
    const { username, password, role } = req.body;
    const { tenantId } = req; // Get tenantId from the admin's session via protect middleware

    if (!username || !password) {
        res.status(400);
        throw new Error('Please provide username and password');
    }

    // Check if user already exists WITHIN THE SAME TENANT
    const userExists = await User.findOne({
        username: username.toLowerCase(),
        tenantId: tenantId
    });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists with that username in this organization.');
    }

    const user = await User.create({
        tenantId, // Associate new user with the admin's tenant
        username: username.toLowerCase(),
        password,
        role: (role && ['admin', 'staff'].includes(role)) ? role : 'staff',
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            username: user.username,
            role: user.role,
            message: 'User registered successfully. They can now login.',
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data provided.');
    }
});

// @desc    Auth user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400); throw new Error('Please provide username and password.');
    }

    // For a multi-tenant app, login should ideally use a globally unique identifier like an email.
    // If using a username that is only unique per tenant, you'd need the user to provide
    // their business name/ID, find the tenant first, then find the user within that tenant.
    // For now, we assume username is globally unique for simplicity of login form.
    const user = await User.findOne({ username: username.toLowerCase() });

    if (user && (await user.matchPassword(password))) {
        if (!user.isActive) {
            res.status(403); throw new Error('Your user account has been disabled.');
        }

        const tenant = await Tenant.findById(user.tenantId);
        if (!tenant || !tenant.isActive) {
             res.status(403); throw new Error('This business account is inactive or has been disabled.');
        }

        const token = generateToken(user._id, user.username, user.role, user.tenantId);
        res.json({
            _id: user._id,
            username: user.username,
            role: user.role,
            profilePictureUrl: user.profilePictureUrl || '', 
            token: token,
        });
    } else {
        res.status(401); // Unauthorized
        throw new Error('Invalid username or password.');
    }
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
    res.status(200).json({ message: 'Logged out successfully.' });
});

// @desc    Get current user's profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
    // req.user is set by 'protect' middleware
    if (req.user) {
        res.json({
            _id: req.user._id,
            username: req.user.username,
            role: req.user.role,
            // profilePictureUrl: req.user.profilePictureUrl || '',
        });
    } else {
        res.status(404);
        throw new Error('User not found.');
    }
});

// @desc    Update current user's own profile (e.g., username)
// @route   PUT /api/auth/me
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) { res.status(404); throw new Error('User not found'); }

    const { username } = req.body;
    if (username && username.toLowerCase() !== user.username) {
        const usernameExists = await User.findOne({
            username: username.toLowerCase(),
            tenantId: user.tenantId, // Check uniqueness within their own tenant
            _id: { $ne: user._id }
        });
        if (usernameExists) {
            res.status(400); throw new Error('Username already taken in your organization.');
        }
        user.username = username.toLowerCase();
    }

    const updatedUser = await user.save();
    res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        role: updatedUser.role,
        // profilePictureUrl: updatedUser.profilePictureUrl || '',
    });
});

// @desc    Change current user's own password
// @route   PUT /api/auth/me/change-password
// @access  Private
const changeUserPassword = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) { res.status(404); throw new Error('User not found'); }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) { res.status(400); throw new Error('Please provide both current and new passwords.'); }
    if (!(await user.matchPassword(currentPassword))) { res.status(401); throw new Error('Incorrect current password.'); }
    if (newPassword.length < 6) { res.status(400); throw new Error('New password must be at least 6 characters long.'); }

    user.password = newPassword; // Mongoose pre-save hook will hash it
    await user.save();
    res.json({ message: 'Password changed successfully.' });
});

// --- ADMIN USER MANAGEMENT FUNCTIONS ---

// @desc    Get all users for the admin's tenant
// @route   GET /api/auth/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
    const users = await User.find({ tenantId: req.tenantId }).select('-password');
    res.json(users);
});

// @desc    Get a single user by ID within the admin's tenant
// @route   GET /api/auth/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400); throw new Error('Invalid user ID format');
    }
    const user = await User.findOne({ _id: req.params.id, tenantId: req.tenantId }).select('-password');
    if (user) {
        res.json(user);
    } else {
        res.status(404); throw new Error('User not found in your organization.');
    }
});

// @desc    Update a user's details (username, role, active status) by ID (by an admin)
// @route   PUT /api/auth/users/:id
// @access  Private/Admin
const updateUserById = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400); throw new Error('Invalid user ID format');
    }
    const user = await User.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!user) { res.status(404); throw new Error('User not found in your organization.'); }

    const { username, role, isActive } = req.body;

    if (username && username.toLowerCase() !== user.username) {
        const usernameExists = await User.findOne({ username: username.toLowerCase(), tenantId: req.tenantId, _id: { $ne: user._id } });
        if (usernameExists) { res.status(400); throw new Error('This username is already taken within your organization.'); }
        user.username = username.toLowerCase();
    }

    if (role && ['admin', 'staff'].includes(role)) {
        if (user.role === 'admin' && role === 'staff') {
            const adminCount = await User.countDocuments({ role: 'admin', tenantId: req.tenantId, isActive: true });
            if (adminCount <= 1) { res.status(400); throw new Error('Cannot demote the only active administrator.'); }
        }
        user.role = role;
    }

    if (isActive !== undefined) {
        // Prevent an admin from disabling themselves if they are the last active admin
        if (user.role === 'admin' && isActive === false && user._id.toString() === req.user.id.toString()) {
             const adminCount = await User.countDocuments({ role: 'admin', isActive: true, tenantId: req.tenantId });
            if (adminCount <= 1) { res.status(400); throw new Error('Cannot disable the only active administrator account.'); }
        }
        user.isActive = isActive;
    }

    const updatedUser = await user.save();
    res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        role: updatedUser.role,
        isActive: updatedUser.isActive
    });
});

// @desc    Delete a user by ID (by an admin)
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400); throw new Error('Invalid user ID format');
    }
    const user = await User.findOne({ _id: req.params.id, tenantId: req.tenantId });
    if (!user) { res.status(404); throw new Error('User not found.'); }
    if (user._id.toString() === req.user.id.toString()) { res.status(400); throw new Error('You cannot delete your own account.'); }
    if (user.role === 'admin') { res.status(400); throw new Error('Cannot delete an administrator account. Demote to staff first.'); }

    const ordersCreated = await Order.countDocuments({ createdBy: user._id, tenantId: req.tenantId });
    if (ordersCreated > 0) { res.status(400); throw new Error('Cannot delete user with existing orders. Please disable the account instead.'); }

    await user.deleteOne();
    res.json({ message: 'User deleted successfully.' });
});
const updateUserProfilePicture = asyncHandler(async (req, res) => {
    console.log(`[AuthCtrl] PUT /api/auth/me/profile-picture for user: ${req.user.id}`);
    const user = await User.findById(req.user.id);

    if (!user) {
        console.error(`[AuthCtrl] User not found for ID: ${req.user.id}`);
        res.status(404);
        throw new Error('User not found');
    }

    if (!req.file) {
        console.log("[AuthCtrl] No file uploaded in request object.");
        res.status(400);
        throw new Error('No image file uploaded.');
    }

    console.log("[AuthCtrl] File received from multer:", req.file);

    
    if (user.profilePictureCloudinaryId) {
        try {
            console.log(`[AuthCtrl] Attempting to delete old Cloudinary image: ${user.profilePictureCloudinaryId}`);
            const deletionResult = await cloudinary.uploader.destroy(user.profilePictureCloudinaryId);
            console.log(`[AuthCtrl] Cloudinary deletion result for ${user.profilePictureCloudinaryId}:`, deletionResult.result);
        } catch (deleteError) {
            console.error(`[AuthCtrl] Failed to delete old Cloudinary image ${user.profilePictureCloudinaryId}:`, deleteError.message || deleteError);
            
        }
    }

    user.profilePictureUrl = req.file.path; 
    user.profilePictureCloudinaryId = req.file.filename; 

    try {
        await user.save();
        console.log(`[AuthCtrl] User profile picture updated in DB. New URL: ${user.profilePictureUrl}`);
        res.json({
            message: 'Profile picture updated successfully.',
            profilePictureUrl: user.profilePictureUrl,
        });
    } catch (dbSaveError) {
        console.error(`[AuthCtrl] Error saving user after picture update:`, dbSaveError);
        // Attempt to delete the just-uploaded image from Cloudinary if DB save fails
        try {
            await cloudinary.uploader.destroy(req.file.filename);
            console.log(`[AuthCtrl] Rolled back Cloudinary upload: ${req.file.filename} due to DB save error.`);
        } catch (rollbackError) {
            console.error(`[AuthCtrl] CRITICAL: Failed to rollback Cloudinary upload ${req.file.filename} after DB error:`, rollbackError);
        }
        res.status(500);
        throw new Error('Failed to update profile picture due to a server error.');
    }
});
// --- STEP 1: REQUEST OTP FOR PASSWORD CHANGE ---
// @desc    Verify current password and send OTP to user's email
// @route   POST /api/auth/me/request-password-change-otp
// @access  Private
const requestPasswordChangeOtp = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) { res.status(404); throw new Error('User not found'); }
    if (!user.email) { res.status(400); throw new Error('No verified email on file to send OTP. Please contact admin.'); }

    const { currentPassword } = req.body;
    if (!currentPassword) { res.status(400); throw new Error('Current password is required to initiate change.'); }

    if (!(await user.matchPassword(currentPassword))) {
        res.status(401); // Unauthorized
        throw new Error('Incorrect current password.');
    }

    // All checks passed, generate and send OTP
    const nanoid = customAlphabet('1234567890', 6);
    const otp = nanoid();

    // Hash the OTP before saving
    const salt = await bcrypt.genSalt(10);
    user.passwordChangeOtp = await bcrypt.hash(otp, salt);
    user.passwordChangeOtpExpires = addMinutes(new Date(), 10); // OTP expires in 10 minutes
    await user.save();

    // Send the plaintext OTP to the user's email
    try {
        await sendNotification(
            { email: user.email, name: user.username },
            'passwordChangeOtp', // templateType key
            { receiptNumber: 'N/A' }, // Dummy order object for placeholders
            { otp: otp } // Pass plaintext OTP as a custom placeholder
        );
        res.json({ message: `A verification code has been sent to ${user.email}.` });
    } catch (error) {
        console.error("Failed to send password change OTP email:", error);
        // Clear OTP fields if email fails to prevent user being stuck
        user.passwordChangeOtp = undefined;
        user.passwordChangeOtpExpires = undefined;
        await user.save();
        res.status(500);
        throw new Error('Failed to send verification email. Please try again later.');
    }
});


// --- STEP 2: CONFIRM OTP AND CHANGE PASSWORD ---
// @desc    Verify OTP and update user's password
// @route   PUT /api/auth/me/confirm-password-change
// @access  Private
const confirmPasswordChange = asyncHandler(async (req, res) => {
    const { otp, newPassword } = req.body;
    if (!otp || !newPassword) { res.status(400); throw new Error('OTP and new password are required.'); }
    if (newPassword.length < 6) { res.status(400); throw new Error('New password must be at least 6 characters long.'); }
    
    const user = await User.findById(req.user.id);
    if (!user || !user.passwordChangeOtp || !user.passwordChangeOtpExpires) {
        res.status(400); throw new Error('No pending password change request found. Please start over.');
    }

    if (new Date() > user.passwordChangeOtpExpires) {
        res.status(400); throw new Error('Your OTP has expired. Please request a new one.');
    }

    const isMatch = await user.matchPasswordChangeOtp(otp);
    if (!isMatch) {
        res.status(400); throw new Error('Invalid OTP provided.');
    }

    // OTP is correct, update password and clear OTP fields
    user.password = newPassword; // The pre-save hook will hash this
    user.passwordChangeOtp = undefined;
    user.passwordChangeOtpExpires = undefined;
    await user.save();

    // For higher security, you would invalidate all other active sessions/tokens for this user here.
    // For now, we just confirm success.

    res.json({ message: 'Password changed successfully.' });
});


// Final Export Block
export {
    registerUser,
    loginUser,
    logoutUser,
    getMe,
    updateUserProfile,
    changeUserPassword,
    updateUserProfilePicture,
    // Admin functions
    getUsers,
    getUserById,
    updateUserById,
    deleteUser,
    requestPasswordChangeOtp, 
    confirmPasswordChange,
};