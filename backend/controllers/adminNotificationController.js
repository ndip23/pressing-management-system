// server/controllers/adminNotificationController.js
import asyncHandler from '../middleware/asyncHandler.js';
import AdminNotification from '../models/AdminNotification.js';

// @desc    Get current admin's notifications (unread first, then read, limited)
// @route   GET /api/admin-notifications
// @access  Private/Admin
const getMyNotifications = asyncHandler(async (req, res) => {
    const { tenantId } = req; 
    let query = { tenantId: tenantId };
    const limit = parseInt(req.query.limit, 10) || 20; // Max notifications to return

    const notifications = await AdminNotification.find({ userId: req.user.id })
        .sort({ read: 1, createdAt: -1 }) // Sort by read status (unread first), then by newest
        .limit(limit);

    const unreadCount = await AdminNotification.countDocuments({
        userId: req.user.id,
        read: false,
    });

    res.json({ notifications, unreadCount });
});

// @desc    Mark a specific notification as read
// @route   PUT /api/admin-notifications/:id/read
// @access  Private/Admin
const markNotificationAsRead = asyncHandler(async (req, res) => {
    const notification = await AdminNotification.findOneAndUpdate(
        { _id: req.params.id, userId: req.user.id }, // Ensure admin owns notification
        { $set: { read: true } },
        { new: true } // Return the updated document
    );

    if (!notification) {
        res.status(404);
        throw new Error('Notification not found or not authorized to update.');
    }
    // Recalculate unread count to send back
    const unreadCount = await AdminNotification.countDocuments({ userId: req.user.id, read: false });
    res.json({ message: 'Notification marked as read.', notification, unreadCount });
});

// @desc    Mark all notifications as read for current admin
// @route   PUT /api/admin-notifications/read-all
// @access  Private/Admin
const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
    const result = await AdminNotification.updateMany(
        { userId: req.user.id, read: false },
        { $set: { read: true } }
    );

    console.log(`[AdminNotifications] Marked ${result.modifiedCount} notifications as read for user ${req.user.id}`);

    // Fetch updated list and count to return, ensuring consistency
    const notifications = await AdminNotification.find({ userId: req.user.id }).sort({ read: 1, createdAt: -1 }).limit(20);
    res.json({ message: 'All viewable notifications marked as read.', notifications, unreadCount: 0 });
});

export { getMyNotifications, markNotificationAsRead, markAllNotificationsAsRead };