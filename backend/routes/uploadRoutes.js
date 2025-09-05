// server/routes/uploadRoutes.js
import express from 'express';
import { uploadImage } from '../controllers/uploadController.js';
// --- THIS IS THE FIX ---
// Import the default export from uploadMiddleware.js and rename it to uploadLogo
import uploadLogo from '../middleware/uploadMiddleware.js';
// --- END OF FIX ---
import { protect } from '../middleware/authMiddleware.js';
import { protectDirectoryAdmin } from '../middleware/directoryAdminMiddleware.js';

const router = express.Router();

// Route for a logged-in Tenant Admin to upload THEIR OWN business logo
router.post(
    '/tenant-logo',
    protect, // First, check if it's a valid tenant user
    uploadLogo.single('logoImage'), // Then, use multer to handle the file upload
    uploadImage // Finally, run the controller to send the response
);

// Route for the Directory Super Admin to upload logos for manual listings
router.post(
    '/listing-logo',
    protectDirectoryAdmin, // First, check if it's the directory admin
    uploadLogo.single('logoImage'),
    uploadImage
);

export default router;