// server/models/PendingUser.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const pendingUserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    otpHash: { // Store the HASH of the OTP, not the plaintext
        type: String,
        required: true,
    },
    signupData: { // Store the entire form payload
        type: Object,
        required: true,
    },
    // This field tells MongoDB to automatically delete the document after this time
    expireAt: {
        type: Date,
        default: () => new Date(Date.now() + 15 * 60 * 1000), // Default to 15 minutes from now
        index: { expires: '1m' }, // Create a TTL index that checks every minute
    },
}, { timestamps: true });

// Hash the OTP before saving it
pendingUserSchema.pre('save', async function (next) {
    if (!this.isModified('otpHash')) {
        return next();
    }
    // The controller passes the plaintext OTP to this field. We hash it here.
    const salt = await bcrypt.genSalt(10);
    this.otpHash = await bcrypt.hash(this.otpHash, salt);
    next();
});

// Method to compare the user's entered OTP with the stored hash
pendingUserSchema.methods.matchOtp = async function (enteredOtp) {
    return await bcrypt.compare(enteredOtp, this.otpHash);
};

const PendingUser = mongoose.model('PendingUser', pendingUserSchema);

export default PendingUser;