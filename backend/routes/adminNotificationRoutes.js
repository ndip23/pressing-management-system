import express from 'express';
import { getMyNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../controllers/adminNotificationController.js'; // Create this controller
import { protect, authorize } from '../middleware/authMiddleware.js';
const router = express.Router();

router.use(protect, authorize('admin')); 

router.get('/', getMyNotifications);
router.put('/:id/read', markNotificationAsRead);
router.put('/read-all', markAllNotificationsAsRead);

export default router;