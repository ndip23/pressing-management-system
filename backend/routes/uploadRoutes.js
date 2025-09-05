// server/routes/uploadRoutes.js
import express from 'express';
import { uploadImage } from '../controllers/uploadController.js';
import { uploadLogo } from '../middleware/uploadMiddleware.js'; // Your existing multer config
import { protect } from '../middleware/authMiddleware.js'; // For tenant admins
import { protectDirectoryAdmin } from '../middleware/directoryAdminMiddleware.js'; // For super admin

const router = express.Router();

// A general image upload route. We protect it based on who is calling it.
// For now, let's create two separate, clearly named routes.

// Route for a logged-in Tenant Admin to upload their own business logo
// The `protect` middleware identifies the tenant user.
router.post('/tenant-logo', protect, uploadLogo.single('logoImage'), uploadImage);

// Route for the Directory Super Admin to upload logos for manual listings
// The `protectDirectoryAdmin` middleware identifies the super admin.
router.post('/listing-logo', protectDirectoryAdmin, uploadLogo.single('logoImage'), uploadImage);

export default router;