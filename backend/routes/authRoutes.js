// server/routes/authRoutes.js
import express from 'express';
import {
    registerUser,
    loginUser,
    logoutUser,
    getMe,
    getUsers,
    updateUserRole
} from '../controllers/authController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// For initial admin setup, you might make register public or use a specific setup script.
// For ongoing user creation, it should be admin-protected.
// router.post('/register', registerUser); // If public registration is desired (not typical for this app)
router.post('/register', protect, authorize('admin'), registerUser); // Admin creates other users

router.post('/login', loginUser);
router.post('/logout', protect, logoutUser); // Ensure user is logged in to log out
router.get('/me', protect, getMe);

// Admin routes for user management
router.get('/users', protect, authorize('admin'), getUsers);
router.put('/users/:id/role', protect, authorize('admin'), updateUserRole);

export default router;