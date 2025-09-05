// server/models/Tenant.js
import mongoose from 'mongoose';
import Settings from './Settings.js'; 

const tenantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Business name is required.'],
        trim: true,
        unique: true,
    },
    slug: { // URL-friendly version of the name
        type: String,
        unique: true, // MUST be unique
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
        lowercase: true 
    },
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
    logoCloudinaryId: { 
        type: String
     },
    isListedInDirectory: { 
        type: Boolean, 
        default: true, 
        index: true 
    },
    // Billing fields
    stripeCustomerId: { 
        type: String 
    },
    stripeSubscriptionId: { 
        type: String 
    },
    stripeSubscriptionStatus: { 
        type: String 
    },
}, { timestamps: true });

tenantSchema.pre('validate', function(next) { 
    
    if (this.isModified('name') || this.isNew) {
        
        this.slug = this.name
            .toLowerCase()
            .replace(/&/g, 'and')       
            .replace(/\s+/g, '-')       
            .replace(/[^\w-]+/g, '')    
            .replace(/--+/g, '-')       
            .replace(/^-+/, '')         
            .replace(/-+$/, '');        

        if (this.isNew) {
            const randomSuffix = Math.random().toString(36).substring(2, 8);
            this.slug = `${this.slug}-${randomSuffix}`;
        }
    }
    next();
});


tenantSchema.post('save', async function(doc, next) {
    
    if (this.isNew) {
        try {
            
            const existingSettings = await Settings.findOne({ tenantId: doc._id });
            if (!existingSettings) {
                console.log(`[Tenant Post-Save Hook] Creating default settings for new tenant: ${doc.name}`);
                await Settings.create({
                    tenantId: doc._id,
                    companyInfo: {
                        name: doc.name,
                        phone: doc.publicPhone,
                        address: doc.publicAddress,
                        email: doc.publicEmail,
                        logoUrl: doc.logoUrl,
                    }
                });
            }
        } catch (error) {
            console.error(`[Tenant Post-Save Hook] FAILED to create settings for tenant ${doc._id}. Error: ${error.message}`);
        }
    }
    next();
});

const Tenant = mongoose.model('Tenant', tenantSchema);

export default Tenant;