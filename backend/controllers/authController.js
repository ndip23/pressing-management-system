// server/controllers/authController.js
import mongoose from 'mongoose';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Tenant from '../models/Tenant.js';
import generateToken from '../utils/generateToken.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { customAlphabet } from 'nanoid'; 
import { addMinutes } from 'date-fns'; 
import { sendNotification } from '../services/notificationService.js'; 
import { cloudinary } from '../config/cloudinaryConfig.js'; 

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password, role } = req.body; // Expect email now
    const { tenantId } = req;

    // --- Validation ---
    if (!username || !email || !password) {
        res.status(400); throw new Error('Please provide username, email, and password');
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
        res.status(400); throw new Error('Please provide a valid email address.');
    }

    // Check if email is globally unique or username is unique within the tenant
    const userExists = await User.findOne({
        $or: [
            { email: email.toLowerCase() },
            { username: username.toLowerCase(), tenantId: tenantId }
        ]
    });
    if (userExists) {
        if (userExists.email === email.toLowerCase()) {
            throw new Error('A user with this email already exists.');
        } else {
            throw new Error('A user with this username already exists in your organization.');
        }
    }

    const user = await User.create({
        tenantId,
        username: username.toLowerCase(),
        email: email.toLowerCase(), // Save the email
        password,
        role: (role && ['admin', 'staff'].includes(role)) ? role : 'staff',
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            message: 'User registered successfully.',
        });
    } else {
        res.status(400); throw new Error('Invalid user data provided.');
    }
});

// @desc    Auth user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) { res.status(400); throw new Error('Please provide username and password.'); }
    const user = await User.findOne({ username: username.toLowerCase() }).select('+password');
    if (!user) { res.status(401); throw new Error('Invalid username or password.'); }
    if (await user.matchPassword(password)) {
        if (!user.isActive) { res.status(403); throw new Error('Your user account has been disabled.'); }
        const tenant = await Tenant.findById(user.tenantId);
        if (!tenant || !tenant.isActive) { res.status(403); throw new Error('This business account is inactive.'); }
        const token = generateToken(user._id, user.username, user.role, user.tenantId);
        res.json({ _id: user._id, username: user.username, role: user.role, token: token });
    } else {
        res.status(401); throw new Error('Invalid username or password.');
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
    if (req.user) {
        res.json({ _id: req.user._id, username: req.user.username, role: req.user.role });
    } else {
        res.status(404); throw new Error('User not found.');
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
        profilePictureUrl: updatedUser.profilePictureUrl || '',
    });
});
// @desc    Request OTP to change password (Step 1)
// @route   POST /api/auth/me/request-password-change-otp
// @access  Private
const requestPasswordChangeOtp = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select('+password'); // Select password to match
    if (!user) { res.status(404); throw new Error('User not found'); }
    if (!user.email) { res.status(400); throw new Error('No email on file to send OTP.'); }
    const { currentPassword } = req.body;
    if (!currentPassword) { res.status(400); throw new Error('Current password is required.'); }
    if (!(await user.matchPassword(currentPassword))) { res.status(401); throw new Error('Incorrect current password.'); }
    const nanoid = customAlphabet('1234567890', 6);
    const otp = nanoid();
    const salt = await bcrypt.genSalt(10);
    user.passwordChangeOtp = await bcrypt.hash(otp, salt);
    user.passwordChangeOtpExpires = addMinutes(new Date(), 10);
    await user.save();
    try {
        await sendNotification({ email: user.email, name: user.username }, 'passwordChangeOtp', { receiptNumber: 'N/A' }, { otp: otp });
        res.json({ message: `A verification code has been sent to ${user.email}.` });
    } catch (error) {
        user.passwordChangeOtp = undefined; user.passwordChangeOtpExpires = undefined; await user.save();
        res.status(500); throw new Error('Failed to send verification email.');
    }
});

// @desc    Confirm OTP and change password (Step 2)
// @route   PUT /api/auth/me/confirm-password-change
// @access  Private
const confirmPasswordChange = asyncHandler(async (req, res) => {
    const { otp, newPassword } = req.body;
    if (!otp || !newPassword) { res.status(400); throw new Error('OTP and new password are required.'); }
    if (newPassword.length < 6) { res.status(400); throw new Error('New password must be at least 6 characters long.'); }
    const user = await User.findById(req.user.id).select('+passwordChangeOtp +passwordChangeOtpExpires');
    if (!user || !user.passwordChangeOtp || !user.passwordChangeOtpExpires) { res.status(400); throw new Error('No pending password change request found.'); }
    if (new Date() > user.passwordChangeOtpExpires) { res.status(400); throw new Error('Your OTP has expired.'); }
    const isMatch = await user.matchPasswordChangeOtp(otp);
    if (!isMatch) { res.status(400); throw new Error('Invalid OTP provided.'); }
    user.password = newPassword;
    user.passwordChangeOtp = undefined;
    user.passwordChangeOtpExpires = undefined;
    await user.save();
    res.json({ message: 'Password changed successfully.' });
});

// --- ADMIN USER MANAGEMENT FUNCTIONS ---
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
    const user = await User.findById(req.user.id);
    if (!user) { res.status(404); throw new Error('User not found'); }
    
    // req.file is populated by the 'multer' middleware
    if (!req.file) { res.status(400); throw new Error('No image file uploaded.'); }

    // If user already has a picture, delete the old one from Cloudinary to save space
    if (user.profilePictureCloudinaryId) {
        try {
            await cloudinary.uploader.destroy(user.profilePictureCloudinaryId);
            console.log(`[AuthCtrl] Deleted old Cloudinary image: ${user.profilePictureCloudinaryId}`);
        } catch (deleteError) {
            // Log error but don't stop the update process
            console.error(`[AuthCtrl] Failed to delete old Cloudinary image ${user.profilePictureCloudinaryId}:`, deleteError);
        }
    }

    // Save the new image's URL and public ID (filename) from Cloudinary
    user.profilePictureUrl = req.file.path;
    user.profilePictureCloudinaryId = req.file.filename; // This is the public_id from Cloudinary

    const updatedUser = await user.save();

    res.json({
        message: 'Profile picture updated successfully.',
        profilePictureUrl: updatedUser.profilePictureUrl,
    });
});

export {
    registerUser,
    loginUser,
    logoutUser,
    getMe,
    updateUserProfile,
    updateUserProfilePicture,
    //changeUserPassword, 
    getUsers,
    getUserById,
    updateUserById,
    deleteUser,
    // New OTP-based password change flow
    requestPasswordChangeOtp,
    confirmPasswordChange,
    // updateUserRole is redundant if using updateUserById
};