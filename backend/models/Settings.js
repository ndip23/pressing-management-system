// server/models/Settings.js
import mongoose from 'mongoose';

// A unique key to ensure only one settings document exists
const SETTINGS_SINGLETON_KEY = 'app_settings_global';

const notificationTemplateSchema = new mongoose.Schema({
    subject: { type: String, default: 'Your Order Update from PressFlow' },
    readyForPickupBody: {
        type: String,
        default: 'Dear {{customerName}},\n\nYour order #{{receiptNumber}} is now ready for pickup.\n\nPlease collect it at your earliest convenience.\n\nThank you,\nPressFlow Team',
    },
    // Add more templates: orderConfirmedBody, orderDelayedBody, etc.
}, { _id: false });

const companyInfoSchema = new mongoose.Schema({
    name: { type: String, default: 'PressFlow Inc.' },
    address: { type: String, default: '123 Main St, Anytown, USA' },
    phone: { type: String, default: '555-PRESS' },
    logoUrl: { type: String, default: '' }, // URL to company logo for receipts/emails
}, { _id: false });


const settingsSchema = new mongoose.Schema({
    singletonKey: { // To ensure only one document
        type: String,
        default: SETTINGS_SINGLETON_KEY,
        unique: true,
        required: true,
    },
    notificationTemplates: {
        type: notificationTemplateSchema,
        default: () => ({}), // Ensure default object is created
    },
    companyInfo: {
        type: companyInfoSchema,
        default: () => ({}),
    },
    // Add other settings groups as needed:
    // pricingRules: { ... },
    // defaultCurrency: { type: String, default: 'USD' },
}, { timestamps: true });

// Static method to get or create the settings document
settingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne({ singletonKey: SETTINGS_SINGLETON_KEY });
    if (!settings) {
        console.log('No settings found, creating default settings document...');
        settings = await this.create({ singletonKey: SETTINGS_SINGLETON_KEY });
    }
    return settings;
};

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;