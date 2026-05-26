// server/schedulers/orderChecker.js
import cron from 'node-cron';
import Order from '../models/Order.js';
import AdminNotification from '../models/AdminNotification.js';
import User from '../models/User.js';
import { addHours, format } from 'date-fns';

const CRON_SCHEDULE = process.env.ORDER_CHECK_CRON || '*/15 * * * *';

const createAdminNotificationsBatch = async (adminUserIds, type, message, order) => {
    const existing = await AdminNotification.find({
        userId: { $in: adminUserIds },
        entityId: order._id,
        type,
        read: false,
    }).select('userId').lean();

    const existingIds = new Set(existing.map((n) => n.userId.toString()));
    const toCreate = adminUserIds.filter((id) => !existingIds.has(id.toString()));

    if (toCreate.length === 0) return false;

    await AdminNotification.insertMany(
        toCreate.map((userId) => ({
            userId,
            type,
            message,
            link: `/orders/${order._id}`,
            entityId: order._id,
            entityType: 'Order',
        }))
    );
    return true;
};

export const startOrderChecks = () => {
    console.log(`[Scheduler] Initializing order check scheduler (${CRON_SCHEDULE})...`);

    cron.schedule(CRON_SCHEDULE, async () => {
        try {
            const now = new Date();
            const warningWindowEnd = addHours(now, 2);

            const adminUsers = await User.find({ role: 'admin' }).select('_id').lean();
            if (adminUsers.length === 0) return;
            const adminUserIds = adminUsers.map((admin) => admin._id);

            const impendingOverdueOrders = await Order.find({
                status: { $nin: ['Completed', 'Cancelled'] },
                expectedPickupDate: { $gt: now, $lte: warningWindowEnd },
                adminImpendingOverdueNotified: { $ne: true },
            }).populate('customer', 'name');

            for (const order of impendingOverdueOrders) {
                const customerName = order.customer?.name || 'N/A';
                const pickupTime = format(new Date(order.expectedPickupDate), 'MMM d, h:mm a');
                const message = `Order #${order.receiptNumber} (${customerName}) is due for pickup at ${pickupTime}.`;

                const created = await createAdminNotificationsBatch(
                    adminUserIds,
                    'overdue_warning',
                    message,
                    order
                );
                if (created) {
                    await Order.findByIdAndUpdate(order._id, {
                        $set: { adminImpendingOverdueNotified: true },
                    });
                }
            }

            const currentlyOverdueOrders = await Order.find({
                status: { $nin: ['Completed', 'Cancelled'] },
                expectedPickupDate: { $lt: now },
                adminActualOverdueNotified: { $ne: true },
            }).populate('customer', 'name');

            for (const order of currentlyOverdueOrders) {
                const customerName = order.customer?.name || 'N/A';
                const expectedDate = format(new Date(order.expectedPickupDate), 'MMM d, yyyy, h:mm a');
                const message = `ALERT: Order #${order.receiptNumber} (${customerName}) is NOW OVERDUE! Expected: ${expectedDate}.`;

                const created = await createAdminNotificationsBatch(
                    adminUserIds,
                    'overdue_alert',
                    message,
                    order
                );
                if (created) {
                    await Order.findByIdAndUpdate(order._id, {
                        $set: { adminActualOverdueNotified: true },
                    });
                }
            }
        } catch (error) {
            console.error('[Scheduler] Critical error during scheduled order checks:', error);
        }
    });
    console.log('[Scheduler] Order check scheduler started.');
};
