// server/routes/webhookRoutes.js
import express from 'express';
import { handleTwilioWhatsapp } from '../controllers/webhookController.js';
// Optional but HIGHLY recommended: Twilio's request validation middleware
// import twilio from 'twilio';

const router = express.Router();

// Middleware to validate that the request is genuinely from Twilio
// This prevents others from spamming your webhook endpoint.
const validateTwilioRequest = (req, res, next) => {
    const twilioSignature = req.headers['x-twilio-signature'];
    const url = process.env.RENDER_EXTERNAL_URL + req.originalUrl; // You need your full public URL
    const params = req.body;
    
    const requestIsValid = twilio.validateRequest(
        process.env.TWILIO_AUTH_TOKEN,
        twilioSignature,
        url,
        params
    );

    if (requestIsValid) {
        next();
    } else {
        console.warn('[Twilio Webhook] Invalid Twilio signature. Request rejected.');
        res.status(403).send('Forbidden');
    }
};

// Twilio sends data as 'application/x-www-form-urlencoded', so we need the urlencoded parser.
// The `validateTwilioRequest` middleware should come after the parser.
router.post('/twilio-whatsapp', express.urlencoded({ extended: false }), /* validateTwilioRequest, */ handleTwilioWhatsapp);

// NOTE: I've commented out `validateTwilioRequest` for now. To make it work, you need to
// set `RENDER_EXTERNAL_URL` in your Render environment variables (e.g., https://your-backend.onrender.com).
// It's easier to get the basic functionality working first, then add validation.

export default router;