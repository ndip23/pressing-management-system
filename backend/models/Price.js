// server/models/Price.js
import mongoose from 'mongoose';

const priceSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        index: true,
    },
    itemType: {
        type: String,
        required: true,
        trim: true,
    },
    serviceType: {
        type: String,
        required: true,
        trim: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
});


priceSchema.index({ tenantId: 1, itemType: 1, serviceType: 1 }, { unique: true });

const Price = mongoose.model('Price', priceSchema);
export default Price;