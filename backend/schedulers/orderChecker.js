import cron from 'node-cron';
import Order from '../models/Order.js';
import AdminNotification from '../models/AdminNotification.js';
import User from '../models/User.js'; // To get all admin IDs
import { subHours, addHours, isWithinInterval, formatISO } from 'date-fns';

const CHECK_INTERVAL = '*/15 * * * *'; // Every 15 minutes

const createAdminNotification = async (adminUserIds, type, message, order) => {
    for (const adminId of adminUserIds) {
        // Avoid duplicate unread notifications for the same order and type
        const existingUnread = await AdminNotification.findOne({
            userId: adminId,
            entityId: order._id,
            type: type,
            read: false,
        });
        if (!existingUnread) {
            await AdminNotification.create({
                userId: adminId,
                type: type,
                message: message,
                link: `/orders/${order._id}`, // Or use order.receiptNumber if your links use that
                entityId: order._id,
                entityType: 'Order',
            });
            console.log(`[Scheduler] Created '${type}' notification for admin ${adminId}, order ${order.receiptNumber}`);
            // TODO: Here you could push a real-time notification via WebSockets if implemented
        }
    }
};

export const startOrderChecks = () => {
    console.log('[Scheduler] Starting periodic order checks...');

    cron.schedule(CHECK_INTERVAL, async () => {
        console.log(`[Scheduler] Running order checks at ${new Date().toISOString()}`);
        try {
            const now = new Date();
            const twoHoursFromNow = addHours(now, 2);
            const oneHourFiftyFiveMinutesFromNow = addHours(now, 1 + (55/60)); // Slightly less than 2 hours

            const adminUsers = await User.find({ role: 'admin' }).select('_id');
            if (adminUsers.length === 0) {
                console.log('[Scheduler] No admin users found to notify.');
                return;
            }
            const adminUserIds = adminUsers.map(admin => admin._id);

            // 1. Find orders becoming overdue in the next 2 hours (e.g., between 1h55m and 2h from now)
            const impendingOverdueOrders = await Order.find({
                status: { $nin: ['Completed', 'Cancelled'] },
                expectedPickupDate: {
                    $gt: oneHourFiftyFiveMinutesFromNow, // Due after 1h55m from now
                    $lte: twoHoursFromNow,         // Due within or at 2h from now
                },
                // notifiedOverdueWarning: { $ne: true } // Add a flag to Order model to avoid re-notifying
            });

            for (const order of impendingOverdueOrders) {
                const message = `Order #${order.receiptNumber} (Customer: ${order.customerNamePlaceholder || 'N/A'}) is due for pickup at ${new Date(order.expectedPickupDate).toLocaleTimeString()}.`; // Populate customerNamePlaceholder
                await createAdminNotification(adminUserIds, 'overdue_warning', message, order);
                // await Order.findByIdAndUpdate(order._id, { notifiedOverdueWarning: true });
            }

            // 2. Find orders that are NOW overdue
            const currentlyOverdueOrders = await Order.find({
                status: { $nin: ['Completed', 'Cancelled'] },
                expectedPickupDate: { $lt: now },
                // notifiedActualOverdue: { $ne: true } // Add a flag to Order model
            });

            for (const order of currentlyOverdueOrders) {
                const message = `Order #${order.receiptNumber} (Customer: ${order.customerNamePlaceholder || 'N/A'}) is NOW OVERDUE! Expected: ${new Date(order.expectedPickupDate).toLocaleDateString()}.`;
                await createAdminNotification(adminUserIds, 'overdue_alert', message, order);
                // await Order.findByIdAndUpdate(order._id, { notifiedActualOverdue: true });
            }

        } catch (error) {
            console.error('[Scheduler] Error during order checks:', error);
        }
    });
};