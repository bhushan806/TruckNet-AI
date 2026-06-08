// ── User Model ──
// SECURITY FIXES:
//   - password field: select:false — never returned in queries unless explicitly selected
//   - passwordResetToken/Expires: select:false — sensitive reset fields excluded by default
//   - loginAttempts + lockUntil: for brute-force protection
//   - isActive: soft account deactivation support
//   - Indexes on email + phone for fast lookups
//   - email/name trimmed and lowercased at schema level

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true,
    },
    // FIX: select:false prevents accidental password exposure in queries
    password: {
        type: String,
        required: true,
        minlength: 8,
        select: false,
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },
    role: {
        type: String,
        enum: ['CUSTOMER', 'DRIVER', 'OWNER', 'ADMIN'],
        default: 'CUSTOMER',
    },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }, // Soft deactivation
    avatar: { type: String },

    // ── Brute-force protection (select:false — internal use only) ──
    loginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false },

    // ── Password Reset (select:false — sensitive fields excluded by default) ──
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
}, { timestamps: true });

// Compound index for login lookup
userSchema.index({ email: 1, isActive: 1 });

export const UserModel = mongoose.model('User', userSchema);
