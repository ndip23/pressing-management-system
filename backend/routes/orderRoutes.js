// server/routes/orderRoutes.js
import express from 'express';
import {
    createOrder,
    getOrders,
    getOrderById,
    updateOrder,
    deleteOrder,
    manuallyNotifyCustomer,
    markOrderAsFullyPaid,
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, createOrder)
    .get(protect, getOrders);

router.route('/:id')
    .get(protect, getOrderById)
    .put(protect, updateOrder)
    .delete(protect, authorize('admin'), deleteOrder);

router.post('/:id/notify', protect, manuallyNotifyCustomer);
router.put('/:id/mark-paid', protect, markOrderAsFullyPaid);

export default router;