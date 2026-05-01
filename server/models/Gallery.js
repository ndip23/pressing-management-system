// server/models/Gallery.js
import mongoose from 'mongoose';

const gallerySchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    imageUrl: { type: String, required: true },
    cloudinaryId: { type: String, required: true },
    caption: { type: String }
}, { timestamps: true });

export default mongoose.model('Gallery', gallerySchema);