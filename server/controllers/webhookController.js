// server/controllers/webhookController.js
import asyncHandler from '../middleware/asyncHandler.js';
import Tenant from '../models/Tenant.js';
import Customer from '../models/Customer.js';
import InboundMessage from '../models/InboundMessage.js';
import PendingUser from '../models/PendingUser.js';
import crypto from 'crypto';
// Import your notification service if you want to forward the message to the admin
// import { sendAdminAlertEmail } from '../services/notificationService.js';

// @desc    Handle incoming WhatsApp messages from Twilio
// @route   POST /api/webhooks/twilio-whatsapp
// @access  Public (but secured by Twilio's signature validation)
const handleTwilioWhatsapp = asyncHandler(async (req, res) => {
    // Twilio sends data as application/x-www-form-urlencoded
    const { From, To, Body, MessageSid } = req.body;

    console.log(`[Twilio Webhook] Received message from ${From} to ${To}. SID: ${MessageSid}`);
    console.log(`[Twilio Webhook] Body: ${Body}`);

    // --- Find which tenant this message belongs to ---
    // The 'To' number should be a Twilio number linked to one of your tenants.
    // You need a way to map this number back to a tenantId.
    // For now, let's assume you've stored this in the Tenant model.
    // A better approach might be a dedicated `PhoneNumber` model if a tenant can have multiple.
    const tenant = await Tenant.findOne({ publicPhone: To.replace('whatsapp:', '') }); // Or a dedicated `twilioWhatsappNumber` field

    if (!tenant) {
        console.error(`[Twilio Webhook] No tenant found for incoming number ${To}. Ignoring message.`);
        // Respond to Twilio so it doesn't keep retrying.
        // We send an empty TwiML response.
        res.type('text/xml').send('<Response></Response>');
        return;
    }

    // --- Find the customer who sent the message ---
    const customer = await Customer.findOne({
        phone: From.replace('whatsapp:', ''),
        tenantId: tenant._id
    });

    // --- Save the inbound message to the database ---
    await InboundMessage.create({
        tenantId: tenant._id,
        from: From,
        to: To,
        body: Body,
        twilioMessageSid: MessageSid,
        customerId: customer ? customer._id : null, // Link to customer if found
        rawPayload: req.body,
    });

    // --- Process the message and generate a reply ---
    let replyMessage = '';
    const lowerCaseBody = Body.toLowerCase().trim();

    if (lowerCaseBody.startsWith('status')) {
        // TODO: Implement order status lookup logic
        replyMessage = "Thank you for your inquiry. We are looking up your order status and will reply shortly.";
    } else if (lowerCaseBody === 'help') {
        replyMessage = `Welcome to ${tenant.name}! You can ask for your order status by texting "status #YourReceiptNumber".`;
    } else {
        // --- Forward message to the business owner (admin) ---
        // This is a crucial step for general inquiries.
        console.log(`[Twilio Webhook] Forwarding general inquiry from ${From} to admin of tenant ${tenant.name}.`);
        // await sendAdminAlertEmail(tenant.adminEmail, `New WhatsApp Message from ${From}`, `Message: ${Body}`);
        // For now, we will just send a simple auto-reply.
        replyMessage = `Thank you for contacting ${tenant.name}. We have received your message and will get back to you shortly.`;
    }

    // --- Respond to Twilio with TwiML to send the reply ---
    // You need the twilio package for this: npm install twilio
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(replyMessage);

    res.type('text/xml').send(twiml.toString());
});
// @desc    Handle incoming webhooks from AccountPe
// @route   POST /api/webhooks/accountpe
// @access  Public
const verifySwychrSignature = (rawBody, signature) => {
    const secret = process.env.ACCOUNTPE_WEBHOOK_SECRET;
    if (!secret) return true;
    if (!signature || !rawBody) return false;
    const expected = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');
    try {
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch (_err) {
        return false;
    }
};

const extractPaymentAttributes = (payload) => {
    return payload?.data?.data?.attributes || null;
};

const isPaymentSuccessful = (statusValue) => {
    if (statusValue === 1 || statusValue === '1') return true;
    if (typeof statusValue === 'string' && statusValue.toLowerCase() === 'success') return true;
    return false;
};

const accountPeWebhook = asyncHandler(async (req, res) => {
    const rawBody = req.body instanceof Buffer ? req.body.toString('utf8') : null;
    const signature = req.headers['x-swychr-signature'];

    if (!verifySwychrSignature(rawBody, signature)) {
        console.warn('[Webhook] Invalid SwyChr signature. Request rejected.');
        return res.status(403).send('Forbidden');
    }

    const payload = rawBody ? JSON.parse(rawBody) : req.body;
    const attributes = extractPaymentAttributes(payload);

    if (!attributes) {
        return res.status(400).send('Invalid webhook payload.');
    }

    const transactionId = attributes.transaction_id;
    const status = attributes.status;

    console.log(`[Webhook] Received for transaction: ${transactionId}, status: ${status}`);

    if (isPaymentSuccessful(status)) {
        // --- CASE 1: NEW SIGNUP ---
        if (transactionId?.startsWith('PRESSFLOW-SUB-')) {
            const pendingUser = await PendingUser.findOne({ 'signupData.transactionId': transactionId });
            if (pendingUser) {
                pendingUser.paymentStatus = 'success';
                pendingUser.paymentConfirmedAt = new Date();
                await pendingUser.save();
                console.log(`[Webhook] Marked payment confirmed for ${pendingUser.email}`);
            }
        } 
        // --- CASE 2: UPGRADE ---
        else if (transactionId?.startsWith('PRESSFLOW-UPGRADE-')) {
            // Transaction ID format: PRESSFLOW-UPGRADE-tenantId-planName-random
            const parts = transactionId.split('-');
            const tenantId = parts[2]; 
            const newPlanName = parts[3]; 
            
            // ✅ FIX: Define tenant AFTER getting the ID
            const tenant = await Tenant.findById(tenantId);
            
            if (tenant) {
                console.log(`[Webhook] Upgrading tenant ${tenant.name} (${tenantId}) to ${newPlanName}`);
                
                const nextBillingDate = new Date();
                nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

                tenant.plan = newPlanName;
                tenant.subscriptionStatus = 'active';
                tenant.trialEndsAt = undefined;
                tenant.nextBillingAt = nextBillingDate;
                await tenant.save();
                console.log(`[Webhook] Tenant ${tenant.name} upgraded successfully.`);
            } else {
                console.error(`[Webhook] ERROR: No tenant found for ID: ${tenantId}`);
            }
        }
    }

    res.status(200).send('Webhook received.');
});

const accountPeRedirect = asyncHandler(async (req, res) => {
    const { flow, transaction_id, email } = req.query;
    const frontendBase = process.env.FRONTEND_URL;

    if (!frontendBase) {
        return res.status(500).send('FRONTEND_URL is not configured.');
    }

    if (flow === 'upgrade') {
        let planName = '';
        if (typeof transaction_id === 'string' && transaction_id.startsWith('PRESSFLOW-UPGRADE-')) {
            const parts = transaction_id.split('-');
            planName = parts[3] || '';
        }
        const redirectUrl = `${frontendBase}/verify-upgrade?transaction_id=${transaction_id || ''}&plan=${encodeURIComponent(planName)}`;
        return res.redirect(302, redirectUrl);
    }

    const redirectUrl = `${frontendBase}/verify-payment?transaction_id=${transaction_id || ''}&email=${email || ''}`;
    return res.redirect(302, redirectUrl);
});

export { accountPeWebhook, accountPeRedirect, handleTwilioWhatsapp };
