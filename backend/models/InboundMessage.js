// server/models/InboundMessage.js
import mongoose from 'mongoose';

const inboundMessageSchema = new mongoose.Schema({
    tenantId: { // Which tenant received this message
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        index: true,
    },
    from: { // The customer's WhatsApp number (e.g., 'whatsapp:+15551234567')
        type: String,
        required: true,
    },
    to: { // The Twilio WhatsApp number that received the message
        type: String,
        required: true,
    },
    body: { // The content of the message
        type: String,
        required: true,
    },
    twilioMessageSid: { // The unique ID from Twilio for this message
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    status: { // To track how the message was handled
        type: String,
        enum: ['received', 'processed', 'replied', 'failed'],
        default: 'received',
    },
    // You could also link this to a customer record if the phone number matches
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
    },
    // Store the raw Twilio payload for debugging
    rawPayload: {
        type: Object,
    }
}, { timestamps: true });

const InboundMessage = mongoose.model('InboundMessage', inboundMessageSchema);
export default InboundMessage;