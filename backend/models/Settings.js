// server/models/Settings.js
import mongoose from 'mongoose';

// These sub-schemas define the default structure for new settings documents
const notificationTemplateSchema = new mongoose.Schema({
    subject: { type: String, default: 'Your Order Update from {{companyName}}' },
    readyForPickupBody: {
        type: String,
        default: 'Dear {{customerName}},\n\nYour order #{{receiptNumber}} is now ready for pickup.\n\nPlease collect it at your earliest convenience.\n\nThank you,\n{{companyName}}',
    },
    manualReminderSubject: { type: String, default: 'Reminder: Your Order #{{receiptNumber}} from {{companyName}} is Ready' },
    manualReminderBody: {
        type: String,
        default: 'Dear {{customerName}},\n\nThis is a friendly reminder that your order #{{receiptNumber}} is still awaiting pickup.\n\nBest regards,\n{{companyName}}',
    },
    // You can add more templates here, e.g., for different email types
}, { _id: false });

const companyInfoSchema = new mongoose.Schema({
    name: { type: String, default: 'My Pressing Business' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    logoUrl: { type: String, default: '' },
}, { _id: false });

const settingsSchema = new mongoose.Schema({
    // Each tenant gets their own settings document, linked by tenantId
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        unique: true, // Only one settings document per tenant
        index: true,
    },
    companyInfo: {
        type: companyInfoSchema,
        default: () => ({}), // Ensures defaults from schema are applied on creation
    },
    notificationTemplates: {
        type: notificationTemplateSchema,
        default: () => ({}),
    },
    defaultCurrencySymbol: {
        type: String,
        default: '$',
    },
    // Dynamically managed lists for this tenant
    itemTypes: {
        type: [{
            type: String,
            trim: true,
        }],
        default: ['Shirt', 'Trousers', 'Suit'], // Sensible defaults for new tenants
    },
    serviceTypes: {
        type: [{
            type: String,
            trim: true,
        }],
        default: ['Wash', 'Iron Only', 'Dry Clean'], // Sensible defaults
    },
}, { timestamps: true });

// We no longer need the static getSettings method as it was for a singleton model.
// Now, we will fetch settings using: Settings.findOne({ tenantId: req.tenantId })

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;