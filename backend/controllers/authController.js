// server/controllers/authController.js
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import asyncHandler from '../middleware/asyncHandler.js';

// @desc    Register a new user (Admin only or initial setup)
// @route   POST /api/auth/register
// @access  Private/Admin (or public for initial admin setup)
const registerUser = asyncHandler(async (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password) {
        res.status(400);
        throw new Error('Please provide username and password');
    }

    const userExists = await User.findOne({ username: username.toLowerCase() });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const user = await User.create({
        username: username.toLowerCase(),
        password,
        role: role || 'staff', // Default to staff if role not provided
    });

    if (user) {
        // Don't send token on register immediately, require login
        res.status(201).json({
            _id: user._id,
            username: user.username,
            role: user.role,
            message: 'User registered successfully. Please login.',
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Auth user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        res.status(400);
        throw new Error('Please provide username and password');
    }

    const user = await User.findOne({ username: username.toLowerCase() });

    if (user && (await user.matchPassword(password))) {
        const token = generateToken(user._id, user.username, user.role);

        // For httpOnly cookie (more secure, frontend needs to be set up to not expect token in body)
        // res.cookie('jwt', token, {
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV !== 'development', // Use secure cookies in production
        //     sameSite: 'strict', // Prevent CSRF attacks
        //     maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        // });

        res.json({
            _id: user._id,
            username: user.username,
            role: user.role,
            token: token, // Send token in response body
        });
    } else {
        res.status(401); // Unauthorized
        throw new Error('Invalid username or password');
    }
});

// @desc    Logout user / clear cookie (if using cookies)
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
    // If using httpOnly cookies:
    // res.cookie('jwt', '', {
    //     httpOnly: true,
    //     expires: new Date(0),
    // });
    res.status(200).json({ message: 'Logged out successfully' });
    // Frontend will handle token removal from localStorage.
});


// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
    // req.user is set by the 'protect' middleware
    if (req.user) {
        res.json({
            _id: req.user._id,
            username: req.user.username,
            role: req.user.role,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
    const users = await User.find({}).select('-password'); // Exclude passwords
    res.json(users);
});


// @desc    Update user role (Admin only)
// @route   PUT /api/auth/users/:id/role
// @access  Private/Admin
const updateUserRole = asyncHandler(async (req, res) => {
    const { role } = req.body;
    if (!role || !['admin', 'staff'].includes(role)) {
        res.status(400);
        throw new Error('Invalid role specified. Must be "admin" or "staff".');
    }

    const user = await User.findById(req.params.id);

    if (user) {
        // Prevent admin from demoting themselves if they are the only admin (add more sophisticated logic if needed)
        if (user.role === 'admin' && req.user.id.toString() === user._id.toString() && role === 'staff') {
            const adminCount = await User.countDocuments({ role: 'admin' });
            if (adminCount <= 1) {
                res.status(400);
                throw new Error('Cannot demote the only administrator.');
            }
        }

        user.role = role;
        await user.save();
        res.json({ message: `User ${user.username}'s role updated to ${role}` });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});


export { registerUser, loginUser, logoutUser, getMe, getUsers, updateUserRole };