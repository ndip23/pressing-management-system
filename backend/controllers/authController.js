// server/controllers/authController.js
import User from '../models/User.js';
import Order from '../models/Order.js';
import generateToken from '../utils/generateToken.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { cloudinary } from '../config/cloudinaryConfig.js'; 

const registerUser = asyncHandler(async (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password) {
        res.status(400);
        throw new Error('Please provide username and password');
    }

    const userExists = await User.findOne({ username: username.toLowerCase() });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists with that username.');
    }

    const user = await User.create({
        username: username.toLowerCase(),
        password, 
        role: (role && ['admin', 'staff'].includes(role)) ? role : 'staff',
    });
    const getUsers = asyncHandler(async (req, res) => {
    const users = await User.find({ tenantId: req.tenantId }).select('-password');
    res.json(users);
});
    const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findOne({ _id: req.params.id, tenantId: req.tenantId }).select('-password');
    if (user) {
        res.json(user);
    } else {
        res.status(404);
        throw new Error('User not found in your organization.');
    }
});
const updateUserById = asyncHandler(async (req, res) => {
    const user = await User.findOne({ _id: req.params.id, tenantId: req.tenantId });

    if (!user) {
        res.status(404);
        throw new Error('User not found in your organization.');
    }

    const { username, role, isActive } = req.body;

    // Check for username conflict if changing
    if (username && username.toLowerCase() !== user.username) {
        const usernameExists = await User.findOne({ username: username.toLowerCase(), tenantId: req.tenantId });
        if (usernameExists) {
            res.status(400);
            throw new Error('This username is already taken within your organization.');
        }
        user.username = username.toLowerCase();
    }

    if (role && ['admin', 'staff'].includes(role)) {
        // Prevent demoting the last admin
        if (user.role === 'admin' && role === 'staff') {
            const adminCount = await User.countDocuments({ role: 'admin', tenantId: req.tenantId });
            if (adminCount <= 1) {
                res.status(400);
                throw new Error('Cannot demote the only administrator.');
            }
        }
        user.role = role;
    }

    if (isActive !== undefined) {
        // Prevent disabling the last admin
        if (user.role === 'admin' && isActive === false) {
             const adminCount = await User.countDocuments({ role: 'admin', isActive: true, tenantId: req.tenantId });
            if (adminCount <= 1) {
                res.status(400);
                throw new Error('Cannot disable the only active administrator.');
            }
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

// @desc    Delete a user
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findOne({ _id: req.params.id, tenantId: req.tenantId });

    if (!user) {
        res.status(404);
        throw new Error('User not found.');
    }

    if (user.role === 'admin') {
        res.status(400);
        throw new Error('Cannot delete an administrator account. Demote to staff first.');
    }

    // Check if user has created orders. A safer approach is to disable rather than delete.
    const ordersCreated = await Order.countDocuments({ createdBy: user._id });
    if (ordersCreated > 0) {
        res.status(400);
        throw new Error('Cannot delete user with existing orders. Please disable the account instead.');
    }

    await user.deleteOne();
    res.json({ message: 'User deleted successfully.' });
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

const loginUser = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        res.status(400);
        throw new Error('Please provide username and password.');
    }

    const user = await User.findOne({ username: username.toLowerCase() });

    if (user && (await user.matchPassword(password))) {
        const tenant = await Tenant.findById(user.tenantId);
        if (!tenant || !tenant.isActive) {
             res.status(403); throw new Error('This business account is inactive.');
        }
        const token = generateToken(user._id, user.username, user.role);
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

const logoutUser = asyncHandler(async (req, res) => {
   
    res.status(200).json({ message: 'Logged out successfully.' });
});

const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select('-password'); 

    if (user) {
        res.json({
            _id: user._id,
            username: user.username,
            role: user.role,
            profilePictureUrl: user.profilePictureUrl || '',
           // user.email 
        });
    } else {
        res.status(404);
        throw new Error('User not found.');
    }
});

const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const { username /*, email */ } = req.body;

    if (username && username.toLowerCase() !== user.username) {
        const usernameExists = await User.findOne({ username: username.toLowerCase(), _id: { $ne: user._id } });
        if (usernameExists) {
            res.status(400);
            throw new Error('Username already taken. Please choose another.');
        }
        user.username = username.toLowerCase();
    }
    // if (email && email.toLowerCase() !== user.email) {
    //     const emailExists = await User.findOne({ email: email.toLowerCase(), _id: { $ne: user._id } });
    //     if (emailExists) {
    //         res.status(400);
    //         throw new Error('Email address is already in use.');
    //     }
    //     user.email = email.toLowerCase();
    // }

    const updatedUser = await user.save();

    res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        role: updatedUser.role,
        profilePictureUrl: updatedUser.profilePictureUrl || '',
        // email: updatedUser.email,
    });
});

const changeUserPassword = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        res.status(400);
        throw new Error('Please provide both current and new passwords.');
    }

    if (!(await user.matchPassword(currentPassword))) {
        res.status(401); // Unauthorized
        throw new Error('Incorrect current password.');
    }

    if (newPassword.length < 6) { 
        res.status(400);
        throw new Error('New password must be at least 6 characters long.');
    }

    user.password = newPassword; 
    await user.save();

    res.json({ message: 'Password changed successfully.' });
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

const getUsers = asyncHandler(async (req, res) => {
    const users = await User.find({}).select('-password'); // Exclude passwords
    res.json(users);
});

const updateUserRole = asyncHandler(async (req, res) => {
    const { role } = req.body;
    if (!role || !['admin', 'staff'].includes(role)) {
        res.status(400);
        throw new Error('Invalid role. Must be "admin" or "staff".');
    }

    const userToUpdate = await User.findById(req.params.id);

    if (!userToUpdate) {
        res.status(404);
        throw new Error('User not found');
    }

    // Prevent admin from demoting themselves if they are the only admin
    if (userToUpdate.role === 'admin' && req.user.id.toString() === userToUpdate._id.toString() && role === 'staff') {
        const adminCount = await User.countDocuments({ role: 'admin' });
        if (adminCount <= 1) {
            res.status(400);
            throw new Error('Cannot demote the only administrator.');
        }
    }

    userToUpdate.role = role;
    await userToUpdate.save();
    res.json({ message: `User ${userToUpdate.username}'s role updated to ${role}.` });
});


export {
    registerUser,
    loginUser,
    logoutUser,
    getMe,
    getUsers,
    getUserById,       
    updateUserById,    
    deleteUser, 
    updateUserProfile,
    changeUserPassword,
    updateUserProfilePicture,
    getUsers,
    updateUserRole,
};