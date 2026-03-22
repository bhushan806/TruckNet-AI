import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
    token: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    isRevoked: { type: Boolean, default: false },
}, { timestamps: true });

// Compound index for fast lookup
refreshTokenSchema.index({ userId: 1, isRevoked: 1 });

export const RefreshTokenModel = mongoose.model('RefreshToken', refreshTokenSchema);
