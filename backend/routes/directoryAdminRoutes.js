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

const router = express.Router();

router.post('/login', loginDirectoryAdmin); // Public login endpoint

router.route('/listings')
    .get(protectDirectoryAdmin, getAllDirectoryListings)
    .post(protectDirectoryAdmin, createDirectoryListing);

router.route('/listings/:id')
    .put(protectDirectoryAdmin, updateDirectoryListing)
    .delete(protectDirectoryAdmin, deleteDirectoryListing);
router.route('/tenants')
    .get(getAllTenants);
router.route('/tenants/:id')
    .get(getTenantById)
    .put(updateTenant);

export default router;