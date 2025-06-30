// server/models/Settings.js
import mongoose from 'mongoose';

const SETTINGS_SINGLETON_KEY = 'app_settings_global';

const notificationTemplateSchema = new mongoose.Schema({
    subject: { // General subject for emails
        type: String,
        default: 'Your Order Update from {{companyName}}',
    },
    readyForPickupEmailBody: {
        type: String,
        default: 'Dear {{customerName}},\n\nYour order #{{receiptNumber}} is now ready for pickup.\nPlease collect it at your earliest convenience.\n\nThank you,\n{{companyName}} Team',
    },
    manualReminderEmailBody: {
        type: String,
        default: 'Dear {{customerName}},\n\nThis is a friendly reminder that your order #{{receiptNumber}} is still awaiting pickup.\n\nBest regards,\n{{companyName}} Team',
    },
    // Specific subjects for email templates (optional, can use general subject)
    readyForPickupEmailSubject: { type: String },
    manualReminderEmailSubject: { type: String },

    // WhatsApp Template SIDs (from Twilio/BSP)
    whatsappOrderReadySid: { type: String, default: '' },
    whatsappManualReminderSid: { type: String, default: '' },
    // Add more SIDs for other WhatsApp templates as needed
    // e.g., whatsappOrderConfirmedSid: { type: String, default: '' }
}, { _id: false });

const companyInfoSchema = new mongoose.Schema({
    name: { type: String, default: 'PressFlow Management' },
    address: { type: String, default: '123 Laundry Lane, Clean City, ST 12345' },
    phone: { type: String, default: '(555) 123-4567' },
    logoUrl: { type: String, default: '' },
}, { _id: false });

const settingsSchema = new mongoose.Schema({
    singletonKey: {
        type: String,
        default: SETTINGS_SINGLETON_KEY,
        unique: true,
        required: true,
        index: true,
    },
     tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        unique: true, 
        index: true,
    },
    notificationTemplates: {
        type: notificationTemplateSchema,
        default: () => ({}),
    },
    companyInfo: {
        type: companyInfoSchema,
        default: () => ({}),
    },
    defaultCurrencySymbol: {
        type: String,
        default: 'FCFA',
    },
    preferredNotificationChannel: {
        type: String,
        enum: ['whatsapp', 'email', 'none'],
        default: 'whatsapp',
    }
}, { timestamps: true });

settingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne({ singletonKey: SETTINGS_SINGLETON_KEY });
    if (!settings) {
        console.log('[SettingsModel] No settings found, creating default settings document...');
        settings = await this.create({
            singletonKey: SETTINGS_SINGLETON_KEY,
            // Mongoose will apply sub-document schema defaults upon creation of these empty objects
            notificationTemplates: {},
            companyInfo: {},
        });
    }
    // Ensure sub-documents always exist, even if created empty somehow
    if (!settings.notificationTemplates) settings.notificationTemplates = {};
    if (!settings.companyInfo) settings.companyInfo = {};
    return settings;
};

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;