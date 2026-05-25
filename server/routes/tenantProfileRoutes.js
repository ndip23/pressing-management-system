// server/routes/tenantProfileRoutes.js
import express from 'express';
import { getMyTenantProfile, updateMyTenantProfile, topUpWallet } from '../controllers/tenantProfileController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes here are protected and require an admin role for the tenant
router.use(protect, authorize('admin'));

router.route('/')
    .get(getMyTenantProfile)
    .put(updateMyTenantProfile);

router.route('/wallet')
    .put(topUpWallet);

export default router;