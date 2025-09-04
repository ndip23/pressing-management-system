// server/routes/directoryAdminRoutes.js
import express from 'express';
import {
    loginDirectoryAdmin,
    createDirectoryListing,
    getAllDirectoryListings,
    updateDirectoryListing,
    deleteDirectoryListing
} from '../controllers/directoryAdminController.js';
import { protectDirectoryAdmin } from '../middleware/directoryAdminMiddleware.js';

const router = express.Router();

router.post('/login', loginDirectoryAdmin); // Public login endpoint

// All routes below are protected
router.route('/listings')
    .get(protectDirectoryAdmin, getAllDirectoryListings)
    .post(protectDirectoryAdmin, createDirectoryListing);

router.route('/listings/:id')
    .put(protectDirectoryAdmin, updateDirectoryListing)
    .delete(protectDirectoryAdmin, deleteDirectoryListing);

export default router;