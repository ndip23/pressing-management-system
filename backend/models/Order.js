// server/models/Order.js
import mongoose from 'mongoose';

// --- DEFINE SUB-SCHEMAS AT THE TOP LEVEL ---
const orderItemSchema = new mongoose.Schema({
    itemType: { type: String, required: [true, 'Item type is required'] },
    serviceType: { type: String, required: [true, 'Service type is required'], enum: ['wash', 'dry clean', 'iron', 'wash & iron', 'special care', 'other'] },
    quantity: { type: Number, required: [true, 'Quantity is required'], min: [1, 'Quantity must be at least 1'] },
    specialInstructions: { type: String, trim: true },
}, { _id: false });

const paymentSchema = new mongoose.Schema({
    amount: { type: Number, required: true, min: [0.01, 'Payment amount must be positive.'] },
    date: { type: Date, default: Date.now },
    method: { type: String, enum: ['Cash', 'Card', 'Mobile Money', 'Other'], default: 'Cash' },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });


// --- MAIN ORDER SCHEMA ---
const orderSchema = new mongoose.Schema({
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    receiptNumber: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    items: [orderItemSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    subTotalAmount: { type: Number, required: true, min: 0, default: 0 },
    discountType: { type: String, enum: ['none', 'percentage', 'fixed'], default: 'none' },
    discountValue: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0, default: 0 },

    payments: [paymentSchema], // Array to store individual payment transactions
    amountPaid: { type: Number, default: 0, min: 0 }, // This is now a calculated sum
    isFullyPaid: { type: Boolean, default: false },
    lastPaymentDate: { type: Date },

    status: { type: String, enum: ['Pending', 'Processing', 'Ready for Pickup', 'Completed', 'Cancelled'], default: 'Pending' },
    dropOffDate: { type: Date, default: Date.now },
    expectedPickupDate: { type: Date, required: true },
    actualPickupDate: { type: Date },
    notes: { type: String, trim: true },
    
    notified: { type: Boolean, default: false }, // For customer notification
    notificationMethod: { type: String, enum: ['email', 'whatsapp', 'sms', 'manual-email', 'manual-whatsapp', 'manual-sms', 'failed-auto', 'no-contact-auto', 'none'], default: 'none' },
    adminNotifiedImpendingOverdue: { type: Boolean, default: false },
    adminNotifiedActualOverdue: { type: Boolean, default: false },
}, { timestamps: true });


// --- MIDDLEWARE HOOK FOR AUTOMATIC CALCULATIONS ---
orderSchema.pre('save', function (next) {
    // 1. Recalculate financial totals if relevant fields changed
    if (this.isNew || this.isModified('subTotalAmount') || this.isModified('discountType') || this.isModified('discountValue')) {
        if (this.discountType === 'percentage' && this.discountValue > 0) {
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

    // 2. If the `payments` array has been modified, recalculate `amountPaid` and `lastPaymentDate`
    if (this.isModified('payments')) {
        this.amountPaid = this.payments.reduce((acc, payment) => acc + payment.amount, 0);
        this.amountPaid = parseFloat(this.amountPaid.toFixed(2));
        
        if (this.payments.length > 0) {
            this.lastPaymentDate = new Date(Math.max.apply(null, this.payments.map(p => new Date(p.date))));
        } else {
            this.lastPaymentDate = undefined;
        }
    }
    
    // 3. Validate that total paid doesn't exceed total amount
    if (this.amountPaid > this.totalAmount + 0.01) { 
        const err = new Error(`Amount paid (${this.amountPaid}) cannot exceed the total amount due (${this.totalAmount}).`);
        return next(err);
    }

    // 4. Finally, update the isFullyPaid status
    this.isFullyPaid = this.totalAmount > 0 && this.amountPaid >= (this.totalAmount - 0.01);
    if (this.totalAmount === 0) { // For $0 or fully discounted orders
        this.isFullyPaid = true;
    }

    next();
});

const Order = mongoose.model('Order', orderSchema);
export default Order;