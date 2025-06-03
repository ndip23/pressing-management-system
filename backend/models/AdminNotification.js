import mongoose from 'mongoose';

const adminNotificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        enum: ['overdue_warning', 'overdue_alert', 'new_order', 'low_stock'],
        required: true,
    },
    message: { type: String, required: true },
    link: { type: String },
    read: { type: Boolean, default: false },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    entityType: { type: String }, 
}, { timestamps: true });

adminNotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
adminNotificationSchema.index({ entityId: 1, type: 1, read: 1, userId: 1 }); // More specific for duplicate check

const AdminNotification = mongoose.model('AdminNotification', adminNotificationSchema);
export default AdminNotification;