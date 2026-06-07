// server/controllers/adminNotificationController.js
import asyncHandler from '../middleware/asyncHandler.js';
import AdminNotification from '../models/AdminNotification.js';

// @desc    Get current admin's notifications (isolated by tenant)
const getMyNotifications = asyncHandler(async (req, res) => {
    const { tenantId } = req; // Extracted from authMiddleware
    const limit = parseInt(req.query.limit, 10) || 20;

    // 🌟 FIX: Use BOTH userId and tenantId to prevent seeing other company alerts
    const notifications = await AdminNotification.find({ 
        userId: req.user.id, 
        tenantId: tenantId 
    })
    .sort({ read: 1, createdAt: -1 })
    .limit(limit);

    const unreadCount = await AdminNotification.countDocuments({
        userId: req.user.id,
        tenantId: tenantId,
        read: false,
    });

    res.json({ notifications, unreadCount });
});

// @desc    Mark a specific notification as read (with tenant check)
const markNotificationAsRead = asyncHandler(async (req, res) => {
    const { tenantId } = req;
    
    const notification = await AdminNotification.findOneAndUpdate(
        { _id: req.params.id, userId: req.user.id, tenantId: tenantId }, 
        { $set: { read: true } },
        { new: true }
    );

    if (!notification) {
        res.status(404);
        throw new Error('Notification not found or unauthorized.');
    }
    
    const unreadCount = await AdminNotification.countDocuments({ 
        userId: req.user.id, 
        tenantId: tenantId,
        read: false 
    });
    res.json({ message: 'Notification marked as read.', notification, unreadCount });
});

// @desc    Mark all (with tenant check)
const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
    const { tenantId } = req;
    
    await AdminNotification.updateMany(
        { userId: req.user.id, tenantId: tenantId, read: false },
        { $set: { read: true } }
    );

    const notifications = await AdminNotification.find({ 
        userId: req.user.id, 
        tenantId: tenantId 
    }).sort({ read: 1, createdAt: -1 }).limit(20);
    
    res.json({ message: 'All notifications marked as read.', notifications, unreadCount: 0 });
});

export { getMyNotifications, markNotificationAsRead, markAllNotificationsAsRead };