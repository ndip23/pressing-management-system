// server/routes/tenantProfileRoutes.js
import express from 'express';
import { getMyTenantProfile, updateMyTenantProfile } from '../controllers/tenantProfileController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes here are protected and require an admin role for the tenant
router.use(protect, authorize('admin'));

router.route('/')
    .get(getMyTenantProfile)
    .put(updateMyTenantProfile);

export default router;