// server/routes/orderRoutes.js
import express from 'express';
import {
    createOrder,
    getOrders,
    getDashboardOrderSummary,
    getOrderById,
    updateOrder,
    deleteOrder,
    manuallyNotifyCustomer,
    markOrderAsFullyPaid,
    markOrderAsPaid,
    recordPartialPayment,
    recordPayment
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { checkSubscription } from '../middleware/subscriptionCheckMiddleware.js'; 
import { canCreateOrder } from '../middleware/usageLimitMiddleware.js';
import { body, validationResult } from 'express-validator';
const router = express.Router();

router.get('/dashboard-summary', protect, getDashboardOrderSummary);

router.route('/')
    .post(protect,checkSubscription, canCreateOrder, createOrder)
    .get(protect, getOrders);

router.route('/:id')
    .get(protect,checkSubscription, getOrderById)
    .put(protect, checkSubscription,updateOrder)
    .delete(protect, checkSubscription, authorize('admin'), deleteOrder);

router.post('/:id/notify', protect, manuallyNotifyCustomer);
router.put('/:id/mark-paid', protect,checkSubscription, markOrderAsFullyPaid);
router.put('/:id/mark-paid', protect,checkSubscription, markOrderAsPaid); 
router.post('/:id/payments', protect,checkSubscription, recordPartialPayment); 
router.post('/:id/payments', protect,checkSubscription, recordPayment);


export default router;