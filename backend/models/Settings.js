// server/models/Settings.js
import mongoose from 'mongoose';

const companyInfoSchema = new mongoose.Schema({
    name: { type: String, default: 'My Pressing Business' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    logoUrl: { type: String, default: '' },
}, { _id: false });

const notificationTemplateSchema = new mongoose.Schema({
    subject: { type: String, default: 'Your Order Update from {{companyName}}' },
    readyForPickupBody: { type: String, default: 'Dear {{customerName}},\n\nYour order #{{receiptNumber}} is ready for pickup.\n\nThank you,\n{{companyName}}' },
    manualReminderSubject: { type: String, default: 'Reminder: Your Order #{{receiptNumber}} is Ready' },
    manualReminderBody: { type: String, default: 'Dear {{customerName}},\nThis is a reminder for your order #{{receiptNumber}}.\n\nThank you,\n{{companyName}}' },
    // --- NEW: WhatsApp Template SIDs ---
    whatsappOrderReadySid: { type: String, default: '' },
    whatsappManualReminderSid: { type: String, default: '' },
}, { _id: false });

const settingsSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        unique: true,
        index: true,
    },
    companyInfo: { type: companyInfoSchema, default: () => ({}) },
    notificationTemplates: { type: notificationTemplateSchema, default: () => ({}) },
    defaultCurrencySymbol: { type: String, default: 'FCFA' }, // Changed default
    // --- NEW: Preferred Channel Setting ---
    preferredNotificationChannel: {
        type: String,
        enum: ['whatsapp', 'email', 'none'],
        default: 'whatsapp',
    },
    itemTypes: { type: [{ type: String, trim: true }], default: ['Shirt', 'Trousers', 'Suit'] },
    serviceTypes: { type: [{ type: String, trim: true }], default: ['Wash', 'Iron Only', 'Dry Clean'] },
}, { timestamps: true });

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;