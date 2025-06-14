import express from 'express';
import { storage as cloudinaryStorage } from '../config/cloudinaryConfig.js';
import multer from 'multer';
import {
    registerUser,
    loginUser,
    logoutUser,
    getMe,
    getUsers,
    updateUserRole,
    updateUserProfilePicture
} from '../controllers/authController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
const upload = multer({ storage: cloudinaryStorage });

router.post('/register', protect, authorize('admin'), registerUser); 

router.post('/login', loginUser);
router.post('/logout', protect, logoutUser); 
router.get('/me', protect, getMe);


router.get('/users', protect, authorize('admin'), getUsers);
router.put('/users/:id/role', protect, authorize('admin'), updateUserRole);
router.put(
    '/me/profile-picture',
    protect,
    upload.single('profilePicture'), 
    updateUserProfilePicture
);

export default router;