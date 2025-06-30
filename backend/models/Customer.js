// server/models/Customer.js
import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true,
    },
    phone: {
        type: String,
        required: [true, 'Customer phone number is required'],
        unique: true, // Ensures phone number is unique for identification
        trim: true,
        // Add validation for phone number format if needed via match or custom validator
    },
    email: {
        type: String,
        trim: true,
        lowercase: true, // Always store emails in lowercase for consistency
        unique: true,    // <<<< Ensures uniqueness for non-null, non-empty values
        sparse: true,    // <<<< Allows multiple documents to have a null/undefined email
        match: [/\S+@\S+\.\S+/, 'Please use a valid email address.'],
    },
    address: {
        type: String,
        trim: true,
    },
    // createdBy: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'User',
    //     // required: true, // Only if you strictly track who created each customer
    // }
}, { timestamps: true });

// If you prefer to define the index separately (gives more control sometimes)
customerSchema.index({ email: 1 }, { unique: true, sparse: true });
customerSchema.index({ phone: 1 }, { unique: true });


const Customer = mongoose.model('Customer', customerSchema);
export default Customer;