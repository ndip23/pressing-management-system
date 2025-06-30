const tenantSchema = new mongoose.Schema({
    name: { type: String, required: true }, 
    plan: { type: String, enum: ['basic', 'pro', 'enterprise'], default: 'basic' },
    stripeCustomerId: { type: String }, 
    isActive: { type: Boolean, default: true },
    // ... other business-level info (address, phone, custom domain if offered)
}, { timestamps: true });
const Tenant = mongoose.model('Tenant', tenantSchema);