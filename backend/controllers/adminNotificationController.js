// server/controllers/adminNotificationController.js
import asyncHandler from '../middleware/asyncHandler.js';
import AdminNotification from '../models/AdminNotification.js';

// @desc    Get current admin's notifications
// @route   GET /api/admin-notifications
// @access  Private/Admin
const getMyNotifications = asyncHandler(async (req, res) => {
    const notifications = await AdminNotification.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .limit(20); // Limit to recent notifications

    const unreadCount = await AdminNotification.countDocuments({
        userId: req.user.id,
        read: false,
    });

    res.json({ notifications, unreadCount });
});

// @desc    Mark a notification as read
// @route   PUT /api/admin-notifications/:id/read
// @access  Private/Admin
const markNotificationAsRead = asyncHandler(async (req, res) => {
    const notification = await AdminNotification.findOneAndUpdate(
        { _id: req.params.id, userId: req.user.id }, // Ensure admin owns notification
        { read: true },
        { new: true } // Return the updated document
    );

    if (!notification) {
        res.status(404);
        throw new Error('Notification not found or not authorized to update.');
    }
    // Recalculate unread count
    const unreadCount = await AdminNotification.countDocuments({ userId: req.user.id, read: false });
    res.json({ notification, unreadCount });
});

// @desc    Mark all notifications as read for current admin
// @route   PUT /api/admin-notifications/read-all
// @access  Private/Admin
const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
    await AdminNotification.updateMany(
        { userId: req.user.id, read: false },
        { $set: { read: true } }
    );
    res.json({ message: 'All notifications marked as read.', unreadCount: 0 });
});

export { getMyNotifications, markNotificationAsRead, markAllNotificationsAsRead };