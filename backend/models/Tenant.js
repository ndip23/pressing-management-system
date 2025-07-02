// server/models/Tenant.js
import mongoose from 'mongoose';
import Settings from './Settings.js'; // Keep this if you have the post-save hook

const tenantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Business name is required.'],
        trim: true,
        unique: true,
    },
    plan: {
        type: String,
        enum: ['trial', 'basic', 'pro', 'enterprise'],
        default: 'trial',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    stripeCustomerId: {
        type: String,
    },
    stripeSubscriptionId: {
        type: String,
    },
    stripeSubscriptionStatus: {
        type: String,
    },
}, { timestamps: true });

// After a new tenant is created, also create their default settings document
tenantSchema.post('save', async function(doc, next) {
    if (this.isNew) {
        try {
            console.log(`[Tenant Post-Save Hook] Creating default settings for new tenant: ${doc.name}`);
            await Settings.create({
                tenantId: doc._id,
                companyInfo: {
                    name: doc.name
                }
            });
        } catch (error) {
            console.error(`[Tenant Post-Save Hook] FAILED to create settings for tenant ${doc._id}. Error: ${error.message}`);
        }
    }
    next();
});

const Tenant = mongoose.model('Tenant', tenantSchema);

export default Tenant; 