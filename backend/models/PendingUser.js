// server/models/PendingUser.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const PENDING_USER_TTL = 15 * 60; 

const pendingUserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    otp: {
        type: String,
        required: true,
    },
    otpExpires: {
        type: Date,
        required: true,
    },
    signupData: { 
        type: Object,
        required: true,
    },
    createdAt: { 
        type: Date,
        default: Date.now,
        // Create a TTL index to automatically delete documents after 15 minutes
        expires: PENDING_USER_TTL,
    },
});

// Hash the OTP before saving for an extra layer of security
pendingUserSchema.pre('save', async function (next) {
    if (!this.isModified('otp')) return next();
    const salt = await bcrypt.genSalt(10);
    this.otp = await bcrypt.hash(this.otp, salt);
    next();
});

// compare entered OTP with the hashed one
pendingUserSchema.methods.matchOtp = async function (enteredOtp) {
    return await bcrypt.compare(enteredOtp, this.otp);
};


const PendingUser = mongoose.model('PendingUser', pendingUserSchema);
export default PendingUser;