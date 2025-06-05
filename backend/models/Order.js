// server/models/Order.js
import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
    itemType: { type: String, required: [true, 'Item type is required'] },
    serviceType: { type: String, required: [true, 'Service type is required'], enum: ['wash', 'dry clean', 'iron', 'wash & iron', 'special care', 'other'] },
    quantity: { type: Number, required: [true, 'Quantity is required'], min: [1, 'Quantity must be at least 1'] },
    specialInstructions: { type: String, trim: true },
}, { _id: false });

const orderSchema = new mongoose.Schema({
    receiptNumber: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    items: [orderItemSchema],
    subTotalAmount: { type: Number, required: true, min: 0, default: 0 },
    discountType: { type: String, enum: ['none', 'percentage', 'fixed'], default: 'none' },
    discountValue: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0, default: 0 },
    amountPaid: { type: Number, default: 0, min: 0 }, // Single field for total amount paid
    isFullyPaid: { type: Boolean, default: false },
    status: { type: String, enum: ['Pending', 'Processing', 'Ready for Pickup', 'Completed', 'Cancelled'], default: 'Pending' },
    dropOffDate: { type: Date, default: Date.now },
    expectedPickupDate: { type: Date, required: true },
    actualPickupDate: { type: Date },
    notes: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notified: { type: Boolean, default: false },
    notificationMethod: { type: String, enum: ['email', 'whatsapp', 'sms', 'manual-email', 'manual-whatsapp', 'manual-sms', 'failed-auto', 'no-contact-auto', 'none'], default: 'none' },
    adminNotifiedImpendingOverdue: { type: Boolean, default: false },
    adminNotifiedActualOverdue: { type: Boolean, default: false },
    lastPaymentDate: { type: Date } // Tracks when amountPaid was last significantly updated
}, { timestamps: true });

orderSchema.pre('save', function (next) {
    // Calculate discount and totalAmount
    if (this.isNew || this.isModified('subTotalAmount') || this.isModified('discountType') || this.isModified('discountValue')) {
        if (this.discountType === 'percentage' && this.discountValue > 0 && this.subTotalAmount > 0) {
            this.discountAmount = (this.subTotalAmount * this.discountValue) / 100;
        } else if (this.discountType === 'fixed' && this.discountValue > 0) {
            this.discountAmount = this.discountValue;
        } else {
            this.discountAmount = 0;
            if (this.discountType === 'none') this.discountValue = 0;
        }
        if (this.discountAmount > this.subTotalAmount) this.discountAmount = this.subTotalAmount;
        this.discountAmount = parseFloat(this.discountAmount.toFixed(2));
        this.totalAmount = parseFloat((this.subTotalAmount - this.discountAmount).toFixed(2));
        if (this.totalAmount < 0) this.totalAmount = 0;
    }

    // Update lastPaymentDate if amountPaid is modified and positive
    if (this.isModified('amountPaid')) {
        if (this.amountPaid > 0) {
            this.lastPaymentDate = new Date();
        } else if (this.amountPaid === 0 && this.getपथValue('amountPaid') > 0) { 
            // If amountPaid was reset to 0 from a positive value, clear lastPaymentDate or handle as per business logic
            // For now, let's clear it if it becomes 0, meaning no payment effectively recorded recently.
            this.lastPaymentDate = undefined; 
        }
    } else if (this.isNew && this.amountPaid > 0 && !this.lastPaymentDate) {
        // If new doc and has initial payment, set lastPaymentDate
        this.lastPaymentDate = new Date();
    }


    // Update isFullyPaid
    if (typeof this.totalAmount === 'number' && typeof this.amountPaid === 'number') {
        this.isFullyPaid = this.amountPaid >= this.totalAmount && this.totalAmount > 0; // Ensure totalAmount > 0 unless it's a $0 order
        if (this.totalAmount === 0) this.isFullyPaid = true; // $0 orders are considered paid
    } else {
        this.isFullyPaid = false;
    }
    next();
});

const Order = mongoose.model('Order', orderSchema);
export default Order;