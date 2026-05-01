// server/routes/uploadRoutes.js
import express from 'express';
import { uploadImage } from '../controllers/uploadController.js';
// ✅ Import the specific instances
import { uploadProfile, uploadLogo } from '../middleware/uploadMiddleware.js'; 

import { protect } from '../middleware/authMiddleware.js';
import { protectDirectoryAdmin } from '../middleware/directoryAdminMiddleware.js';

const router = express.Router();

// Route for Tenant Admin to upload business logo (Use uploadLogo)
router.post(
    '/tenant-logo',
    protect, 
    uploadLogo.single('logoImage'), // ✅ Use uploadLogo instance
    uploadImage
);

// Route for Directory Admin to upload listing logos (Use uploadLogo)
router.post(
    '/listing-logo',
    protectDirectoryAdmin,
    uploadLogo.single('logoImage'), // ✅ Use uploadLogo instance
    uploadImage
);

export default router;