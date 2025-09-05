// server/models/DirectoryListing.js
import mongoose from 'mongoose';
import slugify from 'slugify';

const directoryListingSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Business name is required.'],
        trim: true,
        unique: true,
    },
    slug: {
        type: String,
        unique: true,
        index: true,
    },
    description: {
        type: String,
        trim: true
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
    logoUrl: {
        type: String
    },
    logoCloudinaryId: { 
        type: String 
    },
    isActive: { // So you can enable/disable the listing
        type: Boolean,
        default: true
    },
}, { timestamps: true });

// Mongoose Middleware to auto-generate a unique slug from the name
directoryListingSchema.pre('save', function(next) {
    if (this.isModified('name') || this.isNew) {
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        this.slug = slugify(this.name, {
            lower: true,
            strict: true,
            remove: /[*+~.()'"!:@]/g
        }) + `-${randomSuffix}`;
    }
    next();
});

const DirectoryListing = mongoose.model('DirectoryListing', directoryListingSchema);
export default DirectoryListing;