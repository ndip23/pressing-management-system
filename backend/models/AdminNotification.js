import mongoose from 'mongoose';

const adminNotificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // For which admin
    type: {
        type: String,
        enum: ['overdue_warning', 'overdue_alert', 'new_order', /* other types */],
        required: true,
    },
    message: { type: String, required: true },
    link: { type: String }, // Link to the relevant order/page
    read: { type: Boolean, default: false },
    entityId: { type: mongoose.Schema.Types.ObjectId }, // e.g., Order ID
    entityType: { type: String }, // e.g., 'Order'
}, { timestamps: true });

// Index for efficient querying
adminNotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

const AdminNotification = mongoose.model('AdminNotification', adminNotificationSchema);
export default AdminNotification;