// server/routes/reportRoutes.js
import express from 'express';
import { getDailyPaymentsReport } from '../controllers/paymentReportController.js';
import { protect, authorize } from '../middleware/authMiddleware.js'; // Corrected import path

const router = express.Router();

// Example: All reports require admin access
router.get('/daily-payments', protect, authorize('admin'), getDailyPaymentsReport);

// Add other report routes here later
// router.get('/monthly-sales', protect, authorize('admin'), getMonthlySalesReport);

export default router;