import express from 'express';
import { initiateSubscription, changeSubscriptionPlan, verifyPaymentAndFinalize } from '../controllers/subscriptionController.js';
import { protect } from '../middleware/authMiddleware.js';
import asyncHandler from 'express-async-handler';
const router = express.Router();

router.route('/initiate').post(initiateSubscription);
router.route('/change-plan').post(protect, changeSubscriptionPlan);
router.route('/verify-payment').post(verifyPaymentAndFinalize);
// Add this to server/routes/subscriptionRoutes.js
router.post('/force-verify', protect, asyncHandler(async (req, res) => {
    const { transaction_id } = req.body;
    // Call your existing logic that updates the tenant
    const parts = transaction_id.split('-');
    const tenantId = parts[2];
    const newPlanName = parts[3];

    const tenant = await Tenant.findById(tenantId);
    if (tenant) {
        tenant.plan = newPlanName;
        tenant.subscriptionStatus = 'active';
        await tenant.save();
        res.json({ success: true, plan: newPlanName });
    } else {
        res.status(404).json({ message: "Tenant not found" });
    }
}));

export default router;