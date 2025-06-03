// server/routes/adminNotificationRoutes.js
import express from 'express';
import {
    getMyNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
} from '../controllers/adminNotificationController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes in this file will first run 'protect' then 'authorize('admin')'
// This ensures only logged-in admins can access these endpoints.
router.use(protect, authorize('admin'));

router.get('/', getMyNotifications);
router.put('/read-all', markAllNotificationsAsRead);
router.put('/:id/read', markNotificationAsRead); // Ensure :id route is specific enough

export default router;