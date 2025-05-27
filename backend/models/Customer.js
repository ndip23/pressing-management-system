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
        // Add validation for phone number format if needed
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        sparse: true, // Allows multiple nulls but ensures uniqueness if value exists
        // unique: true, // If you want email to be strictly unique
        match: [/\S+@\S+\.\S+/, 'Please use a valid email address.'],
    },
    address: {
        type: String,
        trim: true,
    },
    // createdBy: { // To track which staff member added the customer
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'User',
    //     required: true,
    // }
}, { timestamps: true });

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;