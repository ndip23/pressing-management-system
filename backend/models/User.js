// server/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        index: true,
    },
    username: {
        type: String,
        required: [true, 'Username is required'],
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long.'],
    },
    role: {
        type: String,
        enum: ['admin', 'staff'],
        default: 'staff',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    passwordChangeOtp: {
        type: String,
        select: false, 
    },
    passwordChangeOtpExpires: {
        type: Date,
        select: false, 
    },
    profilePictureUrl: { type: String, default: '' },
    profilePictureCloudinaryId: { type: String },
     email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true, // Email must be globally unique across all tenants
        trim: true,
        lowercase: true,
        match: [/\S+@\S+\.\S+/, 'Please use a valid email address.'],
    },
    // Add other fields from your controller if they exist on the model
    // e.g., email, profilePictureUrl, profilePictureCloudinaryId
}, { timestamps: true });

// --- Indexes ---
userSchema.index({ username: 1, tenantId: 1 }, { unique: true });
userSchema.index({ email: 1, tenantId: 1 }, { unique: true, sparse: true });
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.matchPasswordChangeOtp = async function (enteredOtp) {
    if (!this.passwordChangeOtp) return false;
    return await bcrypt.compare(enteredOtp, this.passwordChangeOtp);
};

const User = mongoose.model('User', userSchema);
export default User;