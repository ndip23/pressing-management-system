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
    slug: { 
        type: String,
        required: true,
        unique: true,
        index: true,
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
    publicAddress: { 
        type: String, 
        trim: true 
    }, 
    publicPhone: { 
        type: String, 
        trim: true 
    },   
    publicEmail: { 
        type: String, 
        trim: true, 
        lowercase: true },
    city: { 
        type: String, 
        trim: true, 
        index: true 
    }, 
    country: { 
        type: String, 
        trim: true 
    },
    description: { 
        type: String, 
        trim: true 
    }, 
    logoUrl: { 
        type: String 
    }, 
    isListedInDirectory: { 
        type: Boolean, 
        default: true, 
        index: true 
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
tenantSchema.pre('save', function(next) {
    if (this.isModified('name') || this.isNew) {
        this.slug = this.name.toLowerCase().replace(/&/g, 'and').replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    }
    next();
});

const Tenant = mongoose.model('Tenant', tenantSchema);

export default Tenant; 