// server/routes/priceRoutes.js
import express from 'express';
import { getPrices, upsertPrices } from '../controllers/priceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
const router = express.Router();
router.route('/').get(protect, getPrices).put(protect, authorize('admin'), upsertPrices);
export default router;