// server/routes/uploadRoutes.js

import express from 'express';
import { uploadImage } from '../controllers/uploadController.js';
import upload from '../middleware/uploadMiddleware.js';
// --- END OF FIX ---

import { protect } from '../middleware/authMiddleware.js';
import { protectDirectoryAdmin } from '../middleware/directoryAdminMiddleware.js';

const router = express.Router();

// Route for a logged-in Tenant Admin to upload THEIR OWN business logo
router.post(
    '/tenant-logo',
    protect, 
    // Use the correctly imported 'upload' middleware
    upload.single('logoImage'), 
    uploadImage
);

// Route for the Directory Super Admin to upload logos for manual listings
router.post(
    '/listing-logo',
    protectDirectoryAdmin,
    // Use the correctly imported 'upload' middleware here as well
    upload.single('logoImage'),
    uploadImage
);

export default router;