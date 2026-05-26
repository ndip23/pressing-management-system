import express from 'express';
import {
    initiateSubscription,
    changeSubscriptionPlan,
    updateWalletPaymentCountry,
    createWalletTopUpPaymentLink,
    getWalletTopUpEstimate,
    verifyPaymentAndFinalize,
} from '../controllers/subscriptionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { publicPostLimiter } from '../middleware/rateLimiters.js';

const router = express.Router();

router.route('/initiate').post(publicPostLimiter, initiateSubscription);
router.route('/change-plan').post(protect, changeSubscriptionPlan);
router.route('/wallet-payment-country').put(protect, updateWalletPaymentCountry);
router.route('/wallet-topup-estimate').get(protect, getWalletTopUpEstimate);
router.route('/wallet-topup').post(protect, createWalletTopUpPaymentLink);
router.route('/verify-payment').post(publicPostLimiter, verifyPaymentAndFinalize);

export default router;