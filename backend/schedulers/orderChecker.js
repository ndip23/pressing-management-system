// server/schedulers/orderChecker.js
import cron from 'node-cron';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import AdminNotification from '../models/AdminNotification.js';
import User from '../models/User.js';
import { addHours, format, isBefore } from 'date-fns';

const createAdminNotificationIfNotExists = async (adminUserIds, type, message, order) => {
    let createdAnyNew = false;
    for (const adminId of adminUserIds) {
        // Check for an existing, unread notification of the same type for this order and admin
        const existingUnread = await AdminNotification.findOne({
            userId: adminId,
            entityId: order._id,
            type: type,
            read: false, // Only care about unread ones for duplication prevention
        });

        if (!existingUnread) {
            try {
                await AdminNotification.create({
                    userId: adminId,
                    type: type,
                    message: message,
                    link: `/orders/${order._id}`, // Or use order.receiptNumber
                    entityId: order._id,
                    entityType: 'Order',
                });
                console.log(`[Scheduler] Created '${type}' notification for admin ${adminId}, order ${order.receiptNumber}`);
                createdAnyNew = true;
                // TODO: Implement WebSocket push here if desired for real-time updates to admin clients
            } catch (err) {
                console.error(`[Scheduler] Error creating notification for admin ${adminId}, order ${order.receiptNumber}:`, err);
            }
        } else {
            // console.log(`[Scheduler] Notification type '${type}' for order ${order.receiptNumber} already exists unread for admin ${adminId}. Skipping.`);
        }
    }
    return createdAnyNew; // Return true if any new notification was created
};

export const startOrderChecks = () => {
    console.log('[Scheduler] Initializing order check scheduler...');

    // Run every minute for testing. For production, '*/15 * * * *' (every 15 min) or '*/30 * * * *' might be better.
    cron.schedule('* * * * *', async () => {
        console.log(`[Scheduler] Running scheduled order checks at ${new Date().toISOString()}`);
        try {
            const now = new Date();
            // Window for "impending overdue": orders due > now AND <= 2 hours from now
            const warningWindowEnd = addHours(now, 2);

            const adminUsers = await User.find({ role: 'admin' }).select('_id').lean();
            if (adminUsers.length === 0) {
                // console.log('[Scheduler] No admin users found to notify.');
                return;
            }
            const adminUserIds = adminUsers.map(admin => admin._id);

            // 1. Find orders becoming overdue soon (within next 2 hours)
            // Orders that are not completed/cancelled, not yet admin-notified for impending overdue,
            // and their expectedPickupDate is between now and 2 hours from now.
            const impendingOverdueOrders = await Order.find({
                status: { $nin: ['Completed', 'Cancelled'] },
                expectedPickupDate: {
                    $gt: now, // Due in the future
                    $lte: warningWindowEnd, // But within the next 2 hours
                },
                adminImpendingOverdueNotified: { $ne: true } // Only if not already notified
            }).populate('customer', 'name'); // Populate for message personalization

            for (const order of impendingOverdueOrders) {
                const customerName = order.customer?.name || 'N/A';
                const pickupTime = format(new Date(order.expectedPickupDate), 'MMM d, h:mm a');
                const message = `Order #${order.receiptNumber} (${customerName}) is due for pickup at ${pickupTime}.`;

                const notificationCreated = await createAdminNotificationIfNotExists(adminUserIds, 'overdue_warning', message, order);
                if (notificationCreated) {
                    await Order.findByIdAndUpdate(order._id, { $set: { adminImpendingOverdueNotified: true } });
                }
            }

            // 2. Find orders that are NOW overdue
            // Orders that are not completed/cancelled, not yet admin-notified for being actually overdue,
            // and their expectedPickupDate is in the past.
            const currentlyOverdueOrders = await Order.find({
                status: { $nin: ['Completed', 'Cancelled'] },
                expectedPickupDate: { $lt: now }, // Expected pickup is in the past
                adminActualOverdueNotified: { $ne: true } // Only if not already notified
            }).populate('customer', 'name');

            for (const order of currentlyOverdueOrders) {
                const customerName = order.customer?.name || 'N/A';
                const expectedDate = format(new Date(order.expectedPickupDate), 'MMM d, yyyy, h:mm a');
                const message = `ALERT: Order #${order.receiptNumber} (${customerName}) is NOW OVERDUE! Expected: ${expectedDate}.`;

                const notificationCreated = await createAdminNotificationIfNotExists(adminUserIds, 'overdue_alert', message, order);
                if (notificationCreated) {
                    await Order.findByIdAndUpdate(order._id, { $set: { adminActualOverdueNotified: true } });
                }
            }

        } catch (error) {
            console.error('[Scheduler] Critical error during scheduled order checks:', error);
        }
    });
    console.log('[Scheduler] Order check scheduler started (runs every minute for testing).');
};