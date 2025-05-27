// server/services/notificationService.js
import nodemailer from 'nodemailer';
import Settings from '../models/Settings.js'; // <--- Import Settings model

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Helper function to replace placeholders
const applyPlaceholders = (text, placeholders) => {
    if (!text) return '';
    let result = text;
    for (const key in placeholders) {
        const regex = new RegExp(key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
        result = result.replace(regex, placeholders[key] || ''); // Replace with empty string if placeholder value is null/undefined
    }
    return result;
};


const sendNotification = async (customer, templateType, order, customPlaceholders = {}) => {
    const settings = await Settings.getSettings();

    let subjectTemplate = settings.notificationTemplates?.subject || 'Your Order Update from {{companyName}}';
    let bodyTemplate = 'Your order #{{receiptNumber}} status has been updated.'; // Generic fallback

    if (templateType === 'readyForPickup') {
        subjectTemplate = settings.notificationTemplates?.subject || subjectTemplate; // Can use general subject or a specific one
        bodyTemplate = settings.notificationTemplates?.readyForPickupBody || 'Dear {{customerName}},\n\nYour order #{{receiptNumber}} is ready for pickup.\n\nThank you,\n{{companyName}}';
    } else if (templateType === 'manualReminder') {
        subjectTemplate = settings.notificationTemplates?.manualReminderSubject || subjectTemplate;
        bodyTemplate = settings.notificationTemplates?.manualReminderBody || 'Dear {{customerName}},\n\nThis is a reminder for your order #{{receiptNumber}}.\n\nThank you,\n{{companyName}}';
    }
    // Add more 'else if' for other templateTypes as you define them in Settings model

    const placeholders = {
        '{{customerName}}': customer.name,
        '{{receiptNumber}}': order.receiptNumber,
        '{{companyName}}': settings.companyInfo?.name || 'PressFlow',
        '{{companyAddress}}': settings.companyInfo?.address || '',
        '{{companyPhone}}': settings.companyInfo?.phone || '',
        ...customPlaceholders,
    };

    const finalSubject = applyPlaceholders(subjectTemplate, placeholders);
    const finalMessageBody = applyPlaceholders(bodyTemplate, placeholders);

    let notificationMethod = 'none';
    let notificationSent = false;

    // Email sending logic
    if (customer.email) {
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: customer.email,
                subject: finalSubject,
                text: finalMessageBody,
                // html: applyPlaceholders(htmlBodyTemplate, placeholders) // If you have HTML templates
            });
            console.log(`Email notification ('${templateType}') sent to ${customer.email} for order ${order.receiptNumber}.`);
            notificationMethod = 'email';
            notificationSent = true;
        } catch (error) {
            console.error(`Email sending ('${templateType}') to ${customer.email} failed for order ${order.receiptNumber}:`, error.message);
            // Keep notificationSent = false, method = 'none'
        }
    }
    // Placeholder for SMS logic - if re-enabled, it should also use templates
    // else if (twilioClient && customer.phone && process.env.TWILIO_PHONE_NUMBER) { ... }

    if (!notificationSent && !customer.email /* && !customer.phone (if SMS active) */) {
         console.warn(`No contact method (Email) for customer ${customer.name} for order ${order.receiptNumber} to send '${templateType}' notification.`);
    }


    return { sent: notificationSent, method: notificationMethod };
};

export { sendNotification };