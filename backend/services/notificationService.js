// server/services/notificationService.js
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import Settings from '../models/Settings.js';

// --- Nodemailer Transporter Setup ---
let transporter;
if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_PORT) {
    try {
        transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT, 10),
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
                user: process.env.EMAIL_USER.trim(),
                pass: process.env.EMAIL_PASS,
            },
        });
        console.log('[NotificationService] Email transport configured successfully.');
    } catch (error) {
        console.error('[NotificationService] Failed to configure Email transport:', error.message);
        transporter = null;
    }
} else {
    console.warn('[NotificationService] Email credentials (EMAIL_HOST, EMAIL_USER, EMAIL_PASS, EMAIL_PORT) not fully configured. Email notifications will be disabled for this session.');
    transporter = null;
}

// --- Twilio Client Setup ---
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
// Use TWILIO_WHATSAPP_FROM if you specifically want to send via a WhatsApp number,
// otherwise use TWILIO_PHONE_NUMBER for general SMS/Voice capable number.
const twilioSenderNumber = process.env.TWILIO_WHATSAPP_FROM || process.env.TWILIO_PHONE_NUMBER;

let twilioClient = null;
if (twilioAccountSid && twilioAuthToken && twilioSenderNumber) {
    try {
        twilioClient = twilio(twilioAccountSid, twilioAuthToken);
        console.log(`[NotificationService] Twilio client initialized successfully with sender: ${twilioSenderNumber}`);
    } catch (e) {
        console.error('[NotificationService] Failed to initialize Twilio client:', e.message);
        twilioClient = null;
    }
} else {
    console.warn('[NotificationService] Twilio credentials (ACCOUNT_SID, AUTH_TOKEN, and TWILIO_WHATSAPP_FROM/TWILIO_PHONE_NUMBER) not fully configured. Twilio notifications will be disabled.');
    if (!twilioAccountSid) console.warn('[NotificationService] Detail: TWILIO_ACCOUNT_SID is missing or empty.');
    if (!twilioAuthToken) console.warn('[NotificationService] Detail: TWILIO_AUTH_TOKEN is missing or empty.');
    if (!twilioSenderNumber) console.warn('[NotificationService] Detail: TWILIO_WHATSAPP_FROM or TWILIO_PHONE_NUMBER is missing or empty.');
    twilioClient = null;
}

// --- Helper to Apply Placeholders ---
const applyPlaceholders = (text, placeholders) => {
    if (typeof text !== 'string') return '';
    let result = text;
    for (const key in placeholders) {
        const value = (placeholders[key] === null || placeholders[key] === undefined) ? '' : String(placeholders[key]);
        const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(escapedKey, 'g');
        result = result.replace(regex, value);
    }
    return result;
};

// --- Helper to Format Phone Number to E.164 (Basic) ---
const formatPhoneNumberE164 = (phoneNumber) => {
    if (!phoneNumber || typeof phoneNumber !== 'string') return null;
    let cleaned = phoneNumber.replace(/\D/g, '');
    if (phoneNumber.startsWith('+')) return phoneNumber; // Assume already E.164 if starts with +
    // Basic US/Canada assumption for 10-digit numbers. This needs to be more robust for international.
    if (cleaned.length === 10) cleaned = `1${cleaned}`; 
    if (cleaned.length > 0 && cleaned.length >= 11) return `+${cleaned}`; // Basic check for some length
    console.warn(`[NotificationService] Could not reliably format phone number '${phoneNumber}' to E.164.`);
    return null;
};

// --- Main Send Notification Function ---
const sendNotification = async (customer, templateType, order, customPlaceholders = {}) => {
    if (!customer || !order) {
        console.error("[NotificationService] Called with missing customer or order object.");
        return { sent: false, method: 'none', message: "Missing customer or order data." };
    }

    const settings = await Settings.getSettings();
    const company = settings.companyInfo || { name: 'Your Pressing Service' };
    const templates = settings.notificationTemplates || {};
    const currencySymbol = settings.defaultCurrencySymbol || '$';

    console.log(`[NotificationService] Processing notification for order ${order.receiptNumber}, type: ${templateType}, Customer: ${customer.name}`);

    const commonPlaceholders = {
        '{{customerName}}': customer.name || 'Valued Customer',
        '{{receiptNumber}}': order.receiptNumber,
        '{{companyName}}': company.name,
        '{{orderStatus}}': order.status,
        '{{expectedPickupDate}}': order.expectedPickupDate ? new Date(order.expectedPickupDate).toLocaleDateString() : 'N/A',
        '{{totalAmount}}': `${currencySymbol}${(order.totalAmount || 0).toFixed(2)}`,
        ...customPlaceholders,
    };

    let twilioMessageSent = false;
    let emailSent = false;
    let finalMethod = 'none';
    let statusMessage = 'Notification not sent. No suitable contact or service configured.';

    // --- 1. Attempt Twilio (WhatsApp or SMS with Free-Form Text) ---
    if (twilioClient && customer.phone) {
        const e164ToNumber = formatPhoneNumberE164(customer.phone);
        const fromNumber = twilioSenderNumber; // This is your configured Twilio sender
        const isWhatsAppSender = fromNumber.toLowerCase().startsWith('whatsapp:');

        if (e164ToNumber) {
            let messageBodyTemplate;
            // Select message body template based on type
            if (templateType === 'readyForPickup') {
                messageBodyTemplate = templates.readyForPickupBody || `Dear {{customerName}}, your PressFlow order #{{receiptNumber}} is ready for pickup! From {{companyName}}.`;
            } else if (templateType === 'manualReminder') {
                messageBodyTemplate = templates.manualReminderBody || `Dear {{customerName}}, a reminder about your PressFlow order #{{receiptNumber}}. It's ready for pickup. From {{companyName}}.`;
            } else { // Generic fallback
                messageBodyTemplate = `Update for order #{{receiptNumber}}: Status is {{orderStatus}}. From {{companyName}}.`;
            }
            const finalTwilioBody = applyPlaceholders(messageBodyTemplate, commonPlaceholders);

            // Construct the 'to' number correctly for WhatsApp or SMS
            const toTargetNumber = `${isWhatsAppSender ? 'whatsapp:' : ''}${e164ToNumber}`;

            try {
                console.log(`[NotificationService] Attempting Twilio message (Type: ${isWhatsAppSender ? 'WhatsApp Free-Form' : 'SMS'}) to: ${toTargetNumber} from: ${fromNumber}`);
                if (isWhatsAppSender) {
                     console.warn("[NotificationService] Sending FREE-FORM WhatsApp message. For proactive production messages outside 24hr window, use approved templates with SIDs.");
                }

                const message = await twilioClient.messages.create({
                    body: finalTwilioBody,
                    from: fromNumber,
                    to: toTargetNumber,
                });
                console.log(`[NotificationService] Twilio message ('${templateType}') sent to ${customer.phone}. SID: ${message.sid}`);
                twilioMessageSent = true;
                finalMethod = isWhatsAppSender ? 'whatsapp' : 'sms';
                statusMessage = `${finalMethod.toUpperCase()} sent successfully to ${customer.phone}.`;
            } catch (error) {
                statusMessage = `Twilio message to ${customer.phone} failed: ${error.message}`;
                console.error(`[NotificationService] ${statusMessage} (Order: ${order.receiptNumber}). Twilio Error Code: ${error.code}, More Info: ${error.moreInfo || error.message}`);
            }
        } else {
            statusMessage = `Invalid/unformattable phone number '${customer.phone}' for Twilio.`;
            console.warn(`[NotificationService] ${statusMessage} (Order: ${order.receiptNumber})`);
        }
    } else if (customer.phone && !twilioClient) {
        statusMessage = "Twilio client not initialized, but customer has phone. SMS/WhatsApp cannot be sent.";
        console.warn(`[NotificationService] ${statusMessage} (Order: ${order.receiptNumber})`);
    }

    // --- 2. Attempt Email (if Twilio was not sent OR if you want to send both) ---
    // To send both, remove `!twilioMessageSent` condition. For fallback, keep it.
    if (!twilioMessageSent && transporter && customer.email) {
        let emailSubjectTemplate = templates.subject || 'Order #{{receiptNumber}} Update from {{companyName}}';
        let emailBodyTemplate = `Dear {{customerName}},\nYour order #{{receiptNumber}} status is: {{orderStatus}}.\n\nThank you,\n{{companyName}}`;

        if (templateType === 'readyForPickup') {
            // You can have specific email subjects in settings too, e.g., templates.readyForPickupEmailSubject
            emailSubjectTemplate = templates.readyForPickupEmailSubject || templates.subject || 'Your Order #{{receiptNumber}} is Ready!';
            emailBodyTemplate = templates.readyForPickupEmailBody || `Dear {{customerName}},\nYour order #{{receiptNumber}} from {{companyName}} is ready for pickup!`;
        } else if (templateType === 'manualReminder') {
            emailSubjectTemplate = templates.manualReminderEmailSubject || templates.subject || 'Reminder: Your Order #{{receiptNumber}}';
            emailBodyTemplate = templates.manualReminderEmailBody || `Dear {{customerName}},\nThis is a reminder for your order #{{receiptNumber}}.\n\nThank you,\n{{companyName}}`;
        }

        const finalEmailSubject = applyPlaceholders(emailSubjectTemplate, commonPlaceholders);
        const finalEmailBody = applyPlaceholders(emailBodyTemplate, commonPlaceholders);

        try {
            console.log(`[NotificationService] Attempting Email for '${templateType}' to ${customer.email} for order ${order.receiptNumber}`);
            const mailInfo = await transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: customer.email,
                subject: finalEmailSubject,
                text: finalEmailBody,
            });
            console.log(`[NotificationService] Email ('${templateType}') sent to ${customer.email} for order ${order.receiptNumber}. Message ID: ${mailInfo.messageId}`);
            emailSent = true;
            finalMethod = (finalMethod !== 'none' && finalMethod !== 'email') ? `${finalMethod}+email` : 'email'; // Append if Twilio also sent, or set to email
            statusMessage = `Email sent successfully to ${customer.email}.`;
        } catch (error) {
            const emailErr = `Email sending to ${customer.email} failed: ${error.message}`;
            console.error(`[NotificationService] ${emailErr} (Order: ${order.receiptNumber})`, error);
            if (finalMethod === 'none') statusMessage = emailErr;
        }
    } else if (!twilioMessageSent && !transporter && customer.email) {
        statusMessage = "Email (Nodemailer) client not initialized, but customer has email.";
        console.warn(`[NotificationService] ${statusMessage} (Order: ${order.receiptNumber})`);
    } else if (!twilioMessageSent && transporter && !customer.email && finalMethod === 'none') {
         statusMessage = `No email for customer ${customer.name} to send email fallback.`;
         console.warn(`[NotificationService] ${statusMessage} (Order: ${order.receiptNumber})`);
    }

    const overallSentStatus = twilioMessageSent || emailSent;
    if (!overallSentStatus) {
        console.warn(`[NotificationService] Ultimately failed to send any notification for order ${order.receiptNumber}. Last status: ${statusMessage}`);
    } else {
        console.log(`[NotificationService] Notification process completed for order ${order.receiptNumber}. Method(s): ${finalMethod}.`);
    }

    return { sent: overallSentStatus, method: finalMethod, message: statusMessage };
};

export { sendNotification };