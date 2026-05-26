import express from 'express';
import twilio from 'twilio';
import { handleTwilioWhatsapp, accountPeWebhook, accountPeRedirect } from '../controllers/webhookController.js';

const router = express.Router();

const validateTwilioRequest = (req, res, next) => {
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const baseUrl = process.env.TWILIO_WEBHOOK_BASE_URL || process.env.RENDER_EXTERNAL_URL;

    if (!authToken || !baseUrl) {
        if (process.env.NODE_ENV === 'production') {
            console.error('[Twilio Webhook] TWILIO_AUTH_TOKEN or TWILIO_WEBHOOK_BASE_URL missing — rejecting.');
            return res.status(503).send('Webhook validation not configured');
        }
        return next();
    }

    const twilioSignature = req.headers['x-twilio-signature'];
    const url = `${baseUrl.replace(/\/$/, '')}${req.originalUrl}`;
    const requestIsValid = twilio.validateRequest(
        authToken,
        twilioSignature,
        url,
        req.body
    );

    if (requestIsValid) {
        return next();
    }
    console.warn('[Twilio Webhook] Invalid Twilio signature. Request rejected.');
    return res.status(403).send('Forbidden');
};

router.post(
    '/twilio-whatsapp',
    express.urlencoded({ extended: false }),
    validateTwilioRequest,
    handleTwilioWhatsapp
);
router.get('/accountpe', accountPeRedirect);
router.post('/accountpe', express.raw({ type: 'application/json' }), accountPeWebhook);

export default router;
