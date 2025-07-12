// server/routes/authRoutes.js
import express from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { storage as cloudinaryStorage } from '../config/cloudinaryConfig.js'; 
import {
    registerUser,
    loginUser,
    logoutUser,
    getMe,
    getUsers,
    getUserById,
    updateUserById,
    deleteUser,
    // updateUserRole 
    updateUserProfilePicture,
    updateUserProfile,
    requestPasswordChangeOtp,
    confirmPasswordChange
} from '../controllers/authController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login requests per windowMs
    message: 'Too many login attempts from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});
// --- PUBLIC ROUTES ---
router.post('/login', loginLimiter, loginUser);
router.post('/logout', protect, logoutUser);

router.route('/me')
    .get(protect, getMe)                
    .put(protect, updateUserProfile);   

router.post('/me/request-password-change-otp', protect, requestPasswordChangeOtp);
router.put('/me/confirm-password-change', protect, confirmPasswordChange);

router.put(
    '/me/profile-picture', 
    protect,
    upload.single('profilePicture'), 
    updateUserProfilePicture
);


router.post('/register', protect, authorize('admin'), registerUser);


router.get('/users', protect, authorize('admin'), getUsers);

router.route('/users/:id')
    .get(protect, authorize('admin'), getUserById)
    .put(protect, authorize('admin'), updateUserById)
    .delete(protect, authorize('admin'), deleteUser);

export default router;