// ── User Model ──
// SECURITY FIXES:
//   - password field: select:false — never returned in queries unless explicitly selected
//   - passwordResetToken/Expires: select:false — sensitive reset fields excluded by default
//   - loginAttempts + lockUntil: for brute-force protection
//   - isActive: soft account deactivation support
//   - Indexes on email + phone for fast lookups
//   - email/name trimmed and lowercased at schema level
//
// MIGRATION: email & password made optional for OTP-only auth.
//   Existing users with email+password are unaffected.
//   New users can register via phone+OTP without email/password.

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        // MIGRATION: was required:true — now optional for OTP-only users
        unique: true,
        sparse: true,   // allows multiple documents with null/missing email
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
    // MIGRATION: was required:true — now optional for OTP-only users
    password: {
        type: String,
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

    // ── OTP Authentication (select:false — sensitive, internal use only) ──
    otp: { type: String, select: false },              // SHA-256 hashed OTP
    otpExpiresAt: { type: Date, select: false },       // 5-minute expiry
    otpAttempts: { type: Number, default: 0, select: false }, // Max 5 attempts

    // ── Brute-force protection (select:false — internal use only) ──
    loginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false },

    // ── Password Reset (select:false — sensitive fields excluded by default) ──
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
}, { timestamps: true });

// Compound index for login lookup
userSchema.index({ email: 1, isActive: 1 });
userSchema.index({ phone: 1, isActive: 1 });

export const UserModel = mongoose.model('User', userSchema);
