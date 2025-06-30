// server/routes/authRoutes.js
import express from 'express';
import multer from 'multer';
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
    changeUserPassword
} from '../controllers/authController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();


const upload = multer({ storage: cloudinaryStorage });

// --- PUBLIC ROUTES ---
router.post('/login', loginUser);
router.post('/logout', protect, logoutUser);

router.route('/me')
    .get(protect, getMe)                
    .put(protect, updateUserProfile);   

router.put('/me/change-password', protect, changeUserPassword); 

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