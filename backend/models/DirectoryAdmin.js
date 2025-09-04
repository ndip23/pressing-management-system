// server/models/DirectoryAdmin.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const directoryAdminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
}, { timestamps: true });

// Hash password before saving
directoryAdminSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare password
directoryAdminSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const DirectoryAdmin = mongoose.model('DirectoryAdmin', directoryAdminSchema);
export default DirectoryAdmin;