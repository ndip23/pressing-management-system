// server/models/Order.js
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
    amountPaid: { type: Number, default: 0, min: 0 },
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
    lastPaymentDate: { type: Date }
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

    // --- NEW VALIDATION: Ensure amountPaid does not exceed totalAmount ---
    if (typeof this.amountPaid === 'number' && typeof this.totalAmount === 'number') {
        if (this.amountPaid > this.totalAmount) {
            // Option 1: Automatically cap amountPaid to totalAmount (less informative to user unless frontend also does this)
            // this.amountPaid = this.totalAmount;
            // console.warn(`Order ${this.receiptNumber}: amountPaid (${this.amountPaid}) exceeded totalAmount (${this.totalAmount}). Capping amountPaid.`);

            // Option 2: Throw a validation error (more explicit, forces frontend/API caller to handle it)
            const err = new Error(`Amount paid (${this.amountPaid}) cannot exceed the total amount due (${this.totalAmount}).`);
            // To make it behave like a Mongoose validation error, you can attach it to a path:
            // this.invalidate('amountPaid', 'Amount paid cannot exceed the total amount due.', this.amountPaid);
            return next(err); // Stop save and pass error
        }
    }
    // --- END OF NEW VALIDATION ---


    // Update lastPaymentDate logic
    if (this.isModified('amountPaid')) {
        if (this.amountPaid > 0) {
            this.lastPaymentDate = new Date();
        } else if (this.amountPaid === 0) {
            this.lastPaymentDate = undefined;
        }
    } else if (this.isNew && this.amountPaid > 0 && !this.lastPaymentDate) {
        this.lastPaymentDate = new Date();
    }

    // Update isFullyPaid
    if (typeof this.totalAmount === 'number' && typeof this.amountPaid === 'number') {
        // Allow for tiny floating point discrepancies by checking if amountPaid is "close enough"
        this.isFullyPaid = this.amountPaid >= (this.totalAmount - 0.001) && this.totalAmount >= 0;
        if (this.totalAmount === 0) {
            this.isFullyPaid = true;
        }
    } else {
        this.isFullyPaid = false;
    }
    next();
});

const Order = mongoose.model('Order', orderSchema);
export default Order;