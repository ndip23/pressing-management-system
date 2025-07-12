// server/routes/settingsRoutes.js
import express from 'express';
import { getAppSettings, updateAppSettings } from '../controllers/settingsController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect,  getAppSettings)
    .put(protect, authorize('admin'), updateAppSettings);

export default router;