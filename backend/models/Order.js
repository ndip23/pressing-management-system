// server/models/Order.js
import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
    itemType: {
        type: String,
        required: [true, 'Item type is required (e.g., Shirt, Trousers)'],
    },
    serviceType: {
        type: String,
        required: [true, 'Service type is required'],
        enum: ['wash', 'dry clean', 'iron', 'wash & iron', 'other'], // Add 'other' if needed
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [1, 'Quantity must be at least 1'],
    },
    specialInstructions: {
        type: String,
        trim: true,
    },
    isPaid: { // Individual item payment status (optional, if you track this granularly)
        type: Boolean,
        default: false,
    },
    // pricePerItem: { type: Number } // If you store calculated price per item
}, { _id: false }); // No separate _id for subdocuments unless needed

const orderSchema = new mongoose.Schema({
    receiptNumber: {
        type: String,
        required: true,
        unique: true,
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: [true, 'Customer is required for the order'],
    },
    items: [orderItemSchema],
    totalAmount: { // Total calculated or manually entered amount for the order
        type: Number,
        required: [true, 'Total amount is required'],
        min: [0, 'Total amount cannot be negative'],
    },
    amountPaid: { // Amount paid by the customer
        type: Number,
        default: 0,
        min: [0, 'Amount paid cannot be negative'],
    },
    isFullyPaid: { // Automatically determined or manually set
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ['Pending', 'Processing', 'Ready for Pickup', 'Completed', 'Cancelled'],
        default: 'Pending',
    },
    dropOffDate: {
        type: Date,
        default: Date.now,
    },
    expectedPickupDate: {
        type: Date,
        required: [true, 'Expected pickup date is required'],
    },
    actualPickupDate: {
        type: Date,
    },
    notes: { // General notes for the order
        type: String,
        trim: true,
    },
    createdBy: { // Staff member who created the order
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    notified: { // To track if a "Ready for Pickup" notification has been sent
        type: Boolean,
        default: false,
    },
    notificationMethod: { // To track which method was used (email/sms)
        type: String,
        enum: ['email', 'sms', 'none'],
        default: 'none'
    }
}, { timestamps: true });

// Middleware to update isFullyPaid before saving
orderSchema.pre('save', function (next) {
    // Check if totalAmount exists and is a number, and amountPaid is a number
    if (typeof this.totalAmount === 'number' && typeof this.amountPaid === 'number') {
        this.isFullyPaid = this.amountPaid >= this.totalAmount;
    } else if (this.totalAmount === 0) { // If total is 0, consider it paid
        this.isFullyPaid = true;
    } else {
        // If either is not a number or totalAmount is not 0, and amountPaid is not sufficient, it's not fully paid
        this.isFullyPaid = false;
    }

    // Alternative: If you track isPaid per item and want to derive from that
    // if (this.items && this.items.length > 0) {
    //     this.isFullyPaid = this.items.every(item => item.isPaid);
    // }
    next();
});

const Order = mongoose.model('Order', orderSchema);
export default Order;