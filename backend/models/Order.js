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
        enum: ['wash', 'dry clean', 'iron', 'wash & iron', 'special care', 'other'], // Added 'special care'
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
    // isPaid and pricePerItem were conceptual, not strictly needed if tracking payment at order level
}, { _id: false });

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
    subTotalAmount: { // The sum of item prices BEFORE discount
        type: Number,
        required: [true, 'Subtotal amount is required'],
        min: [0, 'Subtotal amount cannot be negative'],
        default: 0,
    },
    discountType: {
        type: String,
        enum: ['none', 'percentage', 'fixed'],
        default: 'none',
    },
    discountValue: { // Percentage value (e.g., 10 for 10%) or fixed amount value
        type: Number,
        default: 0,
        min: [0, 'Discount value cannot be negative if type is not "none"'],
    },
    discountAmount: { // The actual calculated monetary value of the discount
        type: Number,
        default: 0,
        min: [0, 'Discount amount cannot be negative'],
    },
    totalAmount: { // The final amount AFTER discount (subTotalAmount - discountAmount)
        type: Number,
        required: [true, 'Total amount is required'],
        min: [0, 'Total amount cannot be negative'],
        default: 0,
    },
    amountPaid: {
        type: Number,
        default: 0,
        min: [0, 'Amount paid cannot be negative'],
    },
    isFullyPaid: {
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
    notes: {
        type: String,
        trim: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    notified: {
        type: Boolean,
        default: false,
    },
    notificationMethod: {
        type: String,
        enum: ['email', 'whatsapp', 'sms', 'manual-email', 'manual-whatsapp', 'manual-sms', 'failed-auto', 'no-contact-auto', 'none'],
        default: 'none'
    }
}, { timestamps: true });

// Middleware to calculate discountAmount and totalAmount before saving
orderSchema.pre('save', function (next) {
    // Recalculate only if relevant fields are modified or if it's a new document
    if (this.isNew || this.isModified('subTotalAmount') || this.isModified('discountType') || this.isModified('discountValue')) {
        if (this.discountType === 'percentage' && this.discountValue > 0 && this.subTotalAmount > 0) {
            this.discountAmount = (this.subTotalAmount * this.discountValue) / 100;
        } else if (this.discountType === 'fixed' && this.discountValue > 0) {
            this.discountAmount = this.discountValue;
        } else {
            this.discountAmount = 0;
            // If discount type is 'none', ensure value is also 0 for consistency
            if (this.discountType === 'none') {
                this.discountValue = 0;
            }
        }

        // Ensure discount doesn't exceed subtotal
        if (this.discountAmount > this.subTotalAmount) {
            this.discountAmount = this.subTotalAmount;
        }
        // Round discount amount to 2 decimal places
        this.discountAmount = parseFloat(this.discountAmount.toFixed(2));


        this.totalAmount = this.subTotalAmount - this.discountAmount;
        // Round total amount
        this.totalAmount = parseFloat(this.totalAmount.toFixed(2));

        // Ensure total amount is not negative
        if (this.totalAmount < 0) {
            this.totalAmount = 0;
        }
    }

    // Update isFullyPaid
    if (typeof this.totalAmount === 'number' && typeof this.amountPaid === 'number') {
        this.isFullyPaid = this.amountPaid >= this.totalAmount;
    } else if (this.totalAmount === 0 && this.subTotalAmount > 0) { // If total became 0 due to full discount
        this.isFullyPaid = true; // Consider it paid if fully discounted
    } else if (this.totalAmount === 0 && this.subTotalAmount === 0) { // If order was $0 to begin with
         this.isFullyPaid = true;
    }
    else {
        this.isFullyPaid = false;
    }
    next();
});

const Order = mongoose.model('Order', orderSchema);
export default Order;