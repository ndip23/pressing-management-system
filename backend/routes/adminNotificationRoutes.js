// server/routes/adminNotificationRoutes.js
import express from 'express';
import {
    getMyNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
} from '../controllers/adminNotificationController.js';
import { protect } from '../middleware/authMiddleware.js'; // Only need 'protect'

const router = express.Router();

// All routes in this file are now protected for any logged-in user (admin or staff)
router.use(protect);

router.get('/', getMyNotifications);
router.put('/read-all', markAllNotificationsAsRead);
router.put('/:id/read', markNotificationAsRead);

export default router;