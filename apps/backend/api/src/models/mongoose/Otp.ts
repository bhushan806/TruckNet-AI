// ── OTP Model ──
// FIX 7: Stores bcrypt-hashed OTPs with TTL for auto-cleanup.
// One document per phone number — old OTPs are deleted before new ones are created.

import mongoose from 'mongoose';

const OtpSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true,
        index: true,
    },
    hashedOtp: {
        type: String,
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
        // TTL index: MongoDB auto-deletes documents after expiresAt passes
        index: { expireAfterSeconds: 0 },
    },
    attempts: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export const OtpModel = mongoose.model('Otp', OtpSchema);
