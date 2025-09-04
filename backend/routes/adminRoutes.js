// server/routes/adminRoutes.js
import express from 'express';
import {
    createDirectoryListing,
    getAllDirectoryListings,
    updateDirectoryListing,
    deleteDirectoryListing
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js'; // Import from authMiddleware.js

const router = express.Router();
// Protect all admin routes
router.use(protect, authorize('admin'));

// Routes for managing directory-only listings
router.route('/directory-listings')
    .post(createDirectoryListing)
    .get(getAllDirectoryListings);

router.route('/directory-listings/:id')
    .put(updateDirectoryListing)
    .delete(deleteDirectoryListing);

export default router;