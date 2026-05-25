// server/routes/reportRoutes.js
import express from 'express';
import { getDailyPaymentsReport, getWalletDepositReport } from '../controllers/paymentReportController.js';
import { protect, authorize } from '../middleware/authMiddleware.js'; // Corrected import path

const router = express.Router();

// Example: All reports require admin access
router.get('/daily-payments', protect, authorize('admin', 'superadmin'), getDailyPaymentsReport);
router.get('/wallet-deposits', protect, authorize('superadmin'), getWalletDepositReport);

// Add other report routes here later
// router.get('/monthly-sales', protect, authorize('admin', 'superadmin'), getMonthlySalesReport);

export default router;