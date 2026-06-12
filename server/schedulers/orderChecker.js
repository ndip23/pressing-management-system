// server/schedulers/orderChecker.js
import cron from 'node-cron';
import Order from '../models/Order.js';
import AdminNotification from '../models/AdminNotification.js';
import User from '../models/User.js';
import { addHours, format } from 'date-fns';

const CRON_SCHEDULE = process.env.ORDER_CHECK_CRON || '*/15 * * * *';

// 🌟 UPDATED: Added tenantId to the batch creation
const createAdminNotificationsBatch = async (adminUserIds, tenantId, type, message, order) => {
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
            tenantId, // 🌟 CRITICAL: Save the tenantId with the notification
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

            // --- 1. HANDLE IMPENDING OVERDUE ORDERS ---
            const impendingOverdueOrders = await Order.find({
                status: { $nin: ['Completed', 'Cancelled'] },
                expectedPickupDate: { $gt: now, $lte: warningWindowEnd },
                adminImpendingOverdueNotified: { $ne: true },
            }).populate('customer', 'name');

            for (const order of impendingOverdueOrders) {
                // 🌟 FIX: Find admins ONLY for this specific order's business (tenant)
                const businessAdmins = await User.find({ 
                    tenantId: order.tenantId, 
                    role: 'admin' 
                }).select('_id').lean();

                if (businessAdmins.length === 0) continue;
                const adminUserIds = businessAdmins.map(admin => admin._id);

                const customerName = order.customer?.name || 'N/A';
                const pickupTime = format(new Date(order.expectedPickupDate), 'MMM d, h:mm a');
                const message = `Order #${order.receiptNumber} (${customerName}) is due for pickup at ${pickupTime}.`;

                const created = await createAdminNotificationsBatch(
                    adminUserIds,
                    order.tenantId, // 🌟 Pass tenantId
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

            // --- 2. HANDLE ACTUAL OVERDUE ORDERS ---
            const currentlyOverdueOrders = await Order.find({
                status: { $nin: ['Completed', 'Cancelled'] },
                expectedPickupDate: { $lt: now },
                adminActualOverdueNotified: { $ne: true },
            }).populate('customer', 'name');

            for (const order of currentlyOverdueOrders) {
                // 🌟 FIX: Find admins ONLY for this specific order's business (tenant)
                const businessAdmins = await User.find({ 
                    tenantId: order.tenantId, 
                    role: 'admin' 
                }).select('_id').lean();

                if (businessAdmins.length === 0) continue;
                const adminUserIds = businessAdmins.map(admin => admin._id);

                const customerName = order.customer?.name || 'N/A';
                const expectedDate = format(new Date(order.expectedPickupDate), 'MMM d, yyyy, h:mm a');
                const message = `ALERT: Order #${order.receiptNumber} (${customerName}) is NOW OVERDUE! Expected: ${expectedDate}.`;

                const created = await createAdminNotificationsBatch(
                    adminUserIds,
                    order.tenantId, // 🌟 Pass tenantId
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