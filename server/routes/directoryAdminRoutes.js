// server/routes/directoryAdminRoutes.js
import express from 'express';
import {
    loginDirectoryAdmin,
    createDirectoryListing,
    getAllDirectoryListings,
    updateDirectoryListing,
    deleteDirectoryListing,
    getAllTenants,
    updateTenant,
    getTenantById
} from '../controllers/directoryAdminController.js';
import { protectDirectoryAdmin } from '../middleware/directoryAdminMiddleware.js';
import { directoryAdminLoginLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

router.post('/login', directoryAdminLoginLimiter, loginDirectoryAdmin);

router.route('/listings')
    .get(protectDirectoryAdmin, getAllDirectoryListings)
    .post(protectDirectoryAdmin, createDirectoryListing);

router.route('/listings/:id')
    .put(protectDirectoryAdmin, updateDirectoryListing)
    .delete(protectDirectoryAdmin, deleteDirectoryListing);
router.route('/tenants')
    .get(protectDirectoryAdmin, getAllTenants);
router.route('/tenants/:id')
    .get(protectDirectoryAdmin, getTenantById)
    .put(protectDirectoryAdmin, updateTenant);

export default router;