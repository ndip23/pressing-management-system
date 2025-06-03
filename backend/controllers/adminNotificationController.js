// server/controllers/adminNotificationController.js
import asyncHandler from '../middleware/asyncHandler.js';
import AdminNotification from '../models/AdminNotification.js';

// @desc    Get current admin's notifications (unread first, then read, limit results)
// @route   GET /api/admin-notifications
// @access  Private/Admin
const getMyNotifications = asyncHandler(async (req, res) => {
    const adminId = req.user.id; // From protect middleware

    // Fetch unread notifications, newest first
    const unreadNotifications = await AdminNotification.find({ userId: adminId, read: false })
        .sort({ createdAt: -1 })
        .limit(10) // Limit unread shown in dropdown
        .lean();

    // Fetch some read notifications if unread are few, newest first
    const readLimit = Math.max(0, 15 - unreadNotifications.length); // Show up to 15 total initially
    let readNotifications = [];
    if (readLimit > 0) {
        readNotifications = await AdminNotification.find({ userId: adminId, read: true })
            .sort({ createdAt: -1 })
            .limit(readLimit)
            .lean();
    }

    const notifications = [...unreadNotifications, ...readNotifications];
    // Sort combined list again just in case, though individual queries were sorted
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));


    const unreadCount = await AdminNotification.countDocuments({
        userId: adminId,
        read: false,
    });

    res.json({ notifications, unreadCount });
});

// @desc    Mark a specific notification as read
// @route   PUT /api/admin-notifications/:id/read
// @access  Private/Admin
const markNotificationAsRead = asyncHandler(async (req, res) => {
    const notification = await AdminNotification.findOneAndUpdate(
        { _id: req.params.id, userId: req.user.id }, 
        { $set: { read: true } },
        { new: true } 
    ).lean();

    if (!notification) {
        res.status(404);
        throw new Error('Notification not found or not authorized to update.');
    }

    const unreadCount = await AdminNotification.countDocuments({ userId: req.user.id, read: false });
    res.json({ message: "Notification marked as read.", notification, unreadCount });
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