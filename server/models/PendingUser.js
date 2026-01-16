// server/models/pendingUserModel.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const pendingUserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    otpHash: { type: String, required: true },
    signupData: {
        companyInfo: { name: { type: String, required: true } },
        adminUser: {
            username: { type: String, required: true },
            email: { type: String, required: true },
            password: { type: String, required: true }
        },
        currencySymbol: String,
        itemTypes: [String],
        serviceTypes: [String],
        priceList: [Object],
        plan: { type: String, required: true },
        transactionId: { type: String } // For linking payment to registration
    },
    paymentStatus: { type: String },
    paymentConfirmedAt: { type: Date },
    expireAt: {
        type: Date,
        default: () => new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        index: { expires: '1m' },
    },
}, { timestamps: true });

pendingUserSchema.pre('save', async function (next) {
    if (!this.isModified('otpHash')) return next();
    const salt = await bcrypt.genSalt(10);
    this.otpHash = await bcrypt.hash(this.otpHash, salt);
    next();
});

pendingUserSchema.methods.matchOtp = async function (enteredOtp) {
    return await bcrypt.compare(enteredOtp, this.otpHash);
};

const PendingUser = mongoose.model('PendingUser', pendingUserSchema);
export default PendingUser;
