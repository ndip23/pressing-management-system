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
    console.warn('[NotificationService] Email credentials not fully configured. Email notifications will be disabled.');
    transporter = null;
}

// --- Twilio Client Setup ---
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
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
    console.warn('[NotificationService] Twilio credentials not fully configured. Twilio notifications will be disabled.');
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

// --- Helper to Format Phone Number ---
const formatPhoneNumberE164 = (phoneNumber) => {
    if (!phoneNumber || typeof phoneNumber !== 'string') return null;
    let cleaned = phoneNumber.replace(/\D/g, '');
    if (phoneNumber.startsWith('+')) return phoneNumber;
    if (cleaned.length === 10) cleaned = `1${cleaned}`; // Basic US/Canada assumption
    if (cleaned.length >= 11) return `+${cleaned}`;
    return null;
};

// --- Main Send Notification Function ---
const sendNotification = async (customer, templateType, order, customPlaceholders = {}) => {
    if (!customer || (!customer.email && !customer.phone)) {
        console.warn(`[NotificationService] Called for customer without email or phone.`);
        return { sent: false, method: 'none', message: "No customer contact info provided." };
    }

    const settings = await Settings.findOne({ tenantId: order.tenantId }); // Fetch settings for the correct tenant
    if (!settings) {
        console.error(`[NotificationService] CRITICAL: Settings not found for tenant ${order.tenantId}.`);
        return { sent: false, method: 'none', message: "System settings not configured." };
    }
    
    const company = settings.companyInfo || {};
    const templates = settings.notificationTemplates || {};
    const currencySymbol = settings.defaultCurrencySymbol || '$';

    console.log(`[NotificationService] Processing notification for order ${order.receiptNumber || 'N/A'}, type: ${templateType}`);

    const commonPlaceholders = {
        '{{customerName}}': customer.name || 'Valued Customer',
        '{{receiptNumber}}': order.receiptNumber || 'N/A',
        '{{companyName}}': company.name || 'Your Pressing Service',
        '{{orderStatus}}': order.status || 'Updated',
        '{{expectedPickupDate}}': order.expectedPickupDate ? new Date(order.expectedPickupDate).toLocaleDateString() : 'N/A',
        '{{totalAmount}}': `${currencySymbol}${(order.totalAmount || 0).toFixed(2)}`,
        ...customPlaceholders,
    };

    let twilioMessageSent = false;
    let emailSent = false;
    let finalMethod = 'none';
    let statusMessage = 'Notification not sent.';

    // --- 1. Attempt Twilio (WhatsApp or SMS) if configured and customer has phone ---
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

    // --- 2. Attempt Email as fallback or primary if no phone ---
    if (!twilioMessageSent && transporter && customer.email) {
        let emailSubjectTemplate = templates.subject || 'Order #{{receiptNumber}} Update from {{companyName}}';
        let emailBodyTemplate = `Dear {{customerName}},\n\nYour order #{{receiptNumber}} status is: {{orderStatus}}.\n\nThank you,\n{{companyName}}`;

        // CORRECTED: All template logic is now contained in this single block
        if (templateType === 'readyForPickup') {
            emailSubjectTemplate = templates.readyForPickupEmailSubject || templates.subject || 'Your Order #{{receiptNumber}} is Ready!';
            emailBodyTemplate = templates.readyForPickupBody || `Dear {{customerName}},\nYour order #{{receiptNumber}} from {{companyName}} is ready for pickup!`;
        } else if (templateType === 'manualReminder') {
            emailSubjectTemplate = templates.manualReminderEmailSubject || templates.subject || 'Reminder: Your Order #{{receiptNumber}}';
            emailBodyTemplate = templates.manualReminderEmailBody || `Dear {{customerName}},\nThis is a reminder for your order #{{receiptNumber}}.\n\nThank you,\n{{companyName}}`;
        } else if (templateType === 'signupOtp') {
            emailSubjectTemplate = templates.signupOtpSubject || 'Your PressFlow Verification Code';
            emailBodyTemplate = templates.signupOtpBody || 'Welcome to {{companyName}}!\n\nYour verification code is: {{otp}}\n\nThis code will expire in 15 minutes.\n\nIf you did not request this, please ignore this email.';
        } else if (templateType === 'passwordChangeOtp') {
            emailSubjectTemplate = templates.passwordChangeOtpSubject || 'Your PressFlow Password Change Code';
            bodyTemplate = templates.passwordChangeOtpBody || 'Hi {{customerName}},\n\nA password change was requested for your account. Use the verification code below to confirm this change:\n\nVerification Code: {{otp}}\n\nThis code will expire in 10 minutes. If you did not request this, please secure your account or contact support.';
        }

        const finalEmailSubject = applyPlaceholders(emailSubjectTemplate, commonPlaceholders);
        const finalEmailBody = applyPlaceholders(emailBodyTemplate, commonPlaceholders);

        try {
            console.log(`[NotificationService] Attempting Email for '${templateType}' to ${customer.email}`);
            const mailInfo = await transporter.sendMail({
                from: process.env.EMAIL_FROM, to: customer.email, subject: finalEmailSubject, text: finalEmailBody,
            });
            console.log(`[NotificationService] Email ('${templateType}') sent successfully. Message ID: ${mailInfo.messageId}`);
            emailSent = true;
            finalMethod = 'email';
            statusMessage = `Email sent successfully to ${customer.email}.`;
        } catch (error) {
            const emailErr = `Email sending to ${customer.email} failed: ${error.message}`;
            console.error(`[NotificationService] ${emailErr}`, error);
            if (finalMethod === 'none') statusMessage = emailErr;
        }
    }

    const overallSentStatus = twilioMessageSent || emailSent;
    if (!overallSentStatus) {
        console.warn(`[NotificationService] Ultimately failed to send any notification. Final status: ${statusMessage}`);
    } else {
        console.log(`[NotificationService] Notification process completed. Method: ${finalMethod}.`);
    }

    return { sent: overallSentStatus, method: finalMethod, message: statusMessage };
};
export const sendOtpEmail = async (email, otp) => {
    if (!transporter) {
        console.error("[NotificationService] Email service not configured. Cannot send OTP.");
        throw new Error('Email service is not configured.');
    }
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Your PressFlow Verification Code',
        text: `Your verification code is: ${otp}\n\nThis code will expire in 15 minutes.`,
        html: `<p>Your verification code is: <strong>${otp}</strong></p><p>This code will expire in 15 minutes.</p>`,
    };
    await transporter.sendMail(mailOptions);
    console.log(`[NotificationService] OTP email sent to ${email}`);
};

export { sendNotification };