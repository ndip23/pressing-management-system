// server/services/notificationService.js
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import Settings from '../models/Settings.js';
// For robust phone number formatting (optional but highly recommended)
// import { parsePhoneNumberFromString, isValidNumber, E164Number } from 'libphonenumber-js';

// --- Nodemailer Transporter Setup ---
let transporter;
if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || "587", 10),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
} else {
    console.warn('[NotificationService] Email credentials not fully configured. Email notifications will be disabled.');
}


// --- Twilio Client Setup ---
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioWhatsAppFromNumber = process.env.TWILIO_WHATSAPP_FROM_NUMBER;

let twilioClient = null;
if (twilioAccountSid && twilioAuthToken && twilioWhatsAppFromNumber) {
    try {
        twilioClient = twilio(twilioAccountSid, twilioAuthToken);
        console.log('[NotificationService] Twilio client initialized successfully.');
    } catch (e) {
        console.error('[NotificationService] Failed to initialize Twilio client:', e.message);
    }
} else {
    console.warn('[NotificationService] Twilio credentials or FROM number not fully configured in .env. WhatsApp notifications will be disabled.');
}

// --- Helper to Apply Placeholders ---
const applyPlaceholders = (text, placeholders) => {
    if (typeof text !== 'string') return '';
    let result = text;
    for (const key in placeholders) {
        const value = (placeholders[key] === null || placeholders[key] === undefined) ? '' : String(placeholders[key]);
        const regex = new RegExp(key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
        result = result.replace(regex, value);
    }
    return result;
};

// --- Helper to Format Phone Number to E.164 (Basic - Use libphonenumber-js for production) ---
const formatPhoneNumberE164 = (phoneNumber, defaultCountryCode = '1') => { // Default '1' for US/Canada
    if (!phoneNumber || typeof phoneNumber !== 'string') return null;
    let cleaned = phoneNumber.replace(/\D/g, ''); // Remove all non-digits

    // This is a very basic check and might need to be more sophisticated
    // based on your input formats and libphonenumber-js if you use it.
    if (cleaned.length > 10 && cleaned.startsWith(defaultCountryCode)) { // Already has country code like 1xxxxxxxxxx
        // Potentially already E.164 or close enough for some regions
    } else if (cleaned.length === 10) { // Assume it's a local number for the default country
        cleaned = defaultCountryCode + cleaned;
    } else {
        // Number format is unexpected or too short/long
        console.warn(`[NotificationService] Phone number '${phoneNumber}' could not be reliably formatted to E.164 with default country code '${defaultCountryCode}'.`);
        return null; // Or return original if Twilio can handle some variations
    }
    return `+${cleaned}`;
};


// --- Main Send Notification Function ---
const sendNotification = async (customer, templateType, order, customPlaceholders = {}) => {
    if (!customer || !order) {
        console.error("[NotificationService] Called with missing customer or order object.");
        return { sent: false, method: 'none', error: "Missing customer or order data for notification." };
    }

    const settings = await Settings.getSettings();
    const company = settings.companyInfo || {};
    const templates = settings.notificationTemplates || {};
    const preferredChannel = settings.preferredNotificationChannel || 'whatsapp';

    if (preferredChannel === 'none') {
        console.log(`[NotificationService] Notifications globally disabled in settings for order ${order.receiptNumber}.`);
        return { sent: false, method: 'none', error: "Notifications globally disabled." };
    }

    const commonPlaceholders = {
        '{{customerName}}': customer.name || 'Valued Customer',
        '{{receiptNumber}}': order.receiptNumber,
        '{{companyName}}': company.name || 'PressFlow',
        '{{orderStatus}}': order.status,
        '{{expectedPickupDate}}': order.expectedPickupDate ? new Date(order.expectedPickupDate).toLocaleDateString() : 'N/A',
        '{{totalAmount}}': `${settings.defaultCurrencySymbol || '$'}${(order.totalAmount || 0).toFixed(2)}`,
        ...customPlaceholders,
    };

    let notificationSent = false;
    let notificationMethod = 'none';
    let finalErrorMessage = null;

    // --- Attempt WhatsApp ---
    if (preferredChannel === 'whatsapp' || (preferredChannel === 'email' && !customer.email && customer.phone) ) { // Try WhatsApp if preferred or if email preferred but no email exists
        if (twilioClient && customer.phone) {
            let messageTemplateSid = null;
            let contentVariables = {}; // For Twilio {{1}}, {{2}} style placeholders

            if (templateType === 'readyForPickup') {
                messageTemplateSid = templates.whatsappOrderReadySid || process.env.TWILIO_WHATSAPP_TEMPLATE_ORDER_READY_SID;
                contentVariables = { '1': customer.name, '2': order.receiptNumber, '3': company.name };
            } else if (templateType === 'manualReminder') {
                messageTemplateSid = templates.whatsappManualReminderSid || process.env.TWILIO_WHATSAPP_TEMPLATE_MANUAL_REMINDER_SID;
                contentVariables = { '1': customer.name, '2': order.receiptNumber, '3': company.name };
            }

            if (messageTemplateSid) {
                const e164PhoneNumber = formatPhoneNumberE164(customer.phone, process.env.DEFAULT_COUNTRY_CODE_FOR_PHONE_FORMAT);
                if (e164PhoneNumber) {
                    const toWhatsAppNumber = `whatsapp:${e164PhoneNumber}`;
                    try {
                        await twilioClient.messages.create({
                            contentSid: messageTemplateSid,
                            contentVariables: JSON.stringify(contentVariables),
                            from: twilioWhatsAppFromNumber,
                            to: toWhatsAppNumber,
                        });
                        console.log(`[NotificationService] WhatsApp ('${templateType}') sent to ${toWhatsAppNumber} for order ${order.receiptNumber} using template ${messageTemplateSid}.`);
                        notificationSent = true;
                        notificationMethod = 'whatsapp';
                    } catch (error) {
                        finalErrorMessage = `WhatsApp (template ${messageTemplateSid}) sending to ${customer.phone} failed: ${error.message}`;
                        console.error(`[NotificationService] ${finalErrorMessage} for order ${order.receiptNumber}`);
                    }
                } else {
                    finalErrorMessage = `Invalid or unformattable phone number for WhatsApp: ${customer.phone}`;
                    console.warn(`[NotificationService] ${finalErrorMessage} for order ${order.receiptNumber}`);
                }
            } else {
                const warningMsg = `WhatsApp template SID for '${templateType}' not configured.`;
                console.warn(`[NotificationService] ${warningMsg}`);
                if (!finalErrorMessage) finalErrorMessage = warningMsg;
            }
        } else if (!twilioClient) {
             if (!finalErrorMessage) finalErrorMessage = "Twilio client not initialized for WhatsApp.";
            console.warn(`[NotificationService] ${finalErrorMessage}`);
        } else if (!customer.phone) {
             if (!finalErrorMessage) finalErrorMessage = `No phone number for customer ${customer.name} to send WhatsApp.`;
            console.warn(`[NotificationService] ${finalErrorMessage}`);
        }
    }

    // --- Attempt Email (if WhatsApp not sent or if email is preferred and available) ---
    if (!notificationSent && (preferredChannel === 'email' || (preferredChannel === 'whatsapp' && customer.email))) { // Also try email if whatsapp preferred but failed
        if (transporter && customer.email) {
            let emailSubjectTemplate = templates.subject;
            let emailBodyTemplate = 'Your order #{{receiptNumber}} status is: {{orderStatus}}.';

            if (templateType === 'readyForPickup') {
                emailSubjectTemplate = templates.readyForPickupEmailSubject || templates.subject;
                emailBodyTemplate = templates.readyForPickupEmailBody;
            } else if (templateType === 'manualReminder') {
                emailSubjectTemplate = templates.manualReminderEmailSubject || templates.subject;
                emailBodyTemplate = templates.manualReminderEmailBody;
            }

            if (!emailSubjectTemplate || !emailBodyTemplate) {
                const emailTemplateError = `Email template for '${templateType}' not fully configured.`;
                console.warn(`[NotificationService] ${emailTemplateError} for order ${order.receiptNumber}`);
                if (!finalErrorMessage) finalErrorMessage = emailTemplateError;
            } else {
                const finalEmailSubject = applyPlaceholders(emailSubjectTemplate, commonPlaceholders);
                const finalEmailBody = applyPlaceholders(emailBodyTemplate, commonPlaceholders);
                try {
                    await transporter.sendMail({
                        from: process.env.EMAIL_FROM,
                        to: customer.email,
                        subject: finalEmailSubject,
                        text: finalEmailBody,
                    });
                    console.log(`[NotificationService] Email ('${templateType}') sent to ${customer.email} for order ${order.receiptNumber}.`);
                    notificationSent = true;
                    notificationMethod = 'email';
                    finalErrorMessage = null; // Clear previous error if email succeeded
                } catch (error) {
                    const emailErr = `Email sending to ${customer.email} failed: ${error.message}`;
                    console.error(`[NotificationService] ${emailErr} for order ${order.receiptNumber}`);
                    if (!finalErrorMessage) finalErrorMessage = emailErr;
                }
            }
        } else if (!transporter) {
            if (!finalErrorMessage) finalErrorMessage = "Email (Nodemailer) client not initialized.";
            console.warn(`[NotificationService] ${finalErrorMessage}`);
        } else if (preferredChannel === 'email' && !customer.email) {
            if (!finalErrorMessage) finalErrorMessage = `No email address for customer ${customer.name} for preferred email notification.`;
            console.warn(`[NotificationService] ${finalErrorMessage}`);
        }
    }

    if (!notificationSent && !finalErrorMessage) {
        finalErrorMessage = `No suitable contact method found or configured for customer ${customer.name} (Order: ${order.receiptNumber}). Pref: ${preferredChannel}. Phone: ${customer.phone ? 'Yes' : 'No'}. Email: ${customer.email ? 'Yes' : 'No'}.`;
        console.warn(`[NotificationService] ${finalErrorMessage}`);
    }

    return { sent: notificationSent, method: notificationMethod, error: finalErrorMessage };
};

export { sendNotification };