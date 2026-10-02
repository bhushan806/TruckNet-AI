// ── OTP Service ──
// Shared OTP mechanism used by:
//   1. Phone+OTP authentication (login/register)
//   2. Driver invite confirmation
//
// Security:
//   - OTP is 6-digit numeric
//   - Stored as SHA-256 hash on User document (never plaintext)
//   - 5-minute expiry (configurable via OTP_EXPIRY_MS)
//   - Max 5 verification attempts before OTP invalidation
//   - Rate limiting handled at route level (authLimiter)

import crypto from 'crypto';
import { UserModel } from '../models/mongoose/User';
import { getSmsProvider } from './sms.provider';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const OTP_EXPIRY_MS = parseInt(env.OTP_EXPIRY_MS || '300000', 10); // 5 min default
const MAX_OTP_ATTEMPTS = 5;

export class OtpService {
    // ── Hash OTP for safe storage ──
    private hashOtp(otp: string): string {
        return crypto.createHash('sha256').update(otp).digest('hex');
    }

    // ── Generate a 6-digit numeric OTP ──
    private generateOtp(): string {
        // Cryptographically random 6-digit OTP (100000–999999)
        const buffer = crypto.randomBytes(4);
        const num = buffer.readUInt32BE(0);
        const otp = (num % 900000 + 100000).toString();
        return otp;
    }

    /**
     * Send an OTP to a phone number.
     * If the user exists, stores the hashed OTP on their User document.
     * If the user doesn't exist (new registration), stores OTP in a temporary way —
     * the verify step will create the user.
     *
     * @param phone - Indian 10-digit phone number
     * @param purpose - 'auth' for login/register, 'driver_invite' for truck invites
     */
    async sendOtp(phone: string, purpose: 'auth' | 'driver_invite' = 'auth'): Promise<void> {
        const otp = this.generateOtp();
        const hashedOtp = this.hashOtp(otp);
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

        // Find or prepare user
        const user = await UserModel.findOne({ phone });

        if (user) {
            // Existing user — store OTP on their document
            await UserModel.updateOne(
                { _id: user._id },
                {
                    $set: {
                        otp: hashedOtp,
                        otpExpiresAt: expiresAt,
                        otpAttempts: 0,
                    },
                }
            );
        } else {
            // New phone number — we'll create the user at verify time.
            // For now, we need a temporary record to store the OTP.
            // Strategy: Create a minimal placeholder user with just phone + OTP.
            // The verify endpoint will check if name/role are set; if not,
            // the client must provide them.
            //
            // NOTE: We DON'T create the user here. The OTP is stored ephemerally
            // in a way that the verify step can validate it. We use a lightweight
            // approach: store in the User collection with a flag, or use a separate
            // temporary store. For simplicity and reuse, we create a minimal user
            // that gets fully populated at verify time.
            //
            // Actually, let's NOT create a user yet. Instead, we'll store the OTP
            // associated with the phone number in a dedicated field approach:
            // We temporarily create a user with isVerified=false, no name (will be
            // required at verify time for new users).

            // For new phone numbers, we don't create anything yet.
            // The OTP is stored in-memory (or we create a temporary unverified user).
            // DECISION: Store on a temporary unverified user record.
            // This is safe because: phone is unique, the record is incomplete,
            // and the verify step will fully populate it or reject.

            // Actually, a cleaner approach: just don't store anything for unknown
            // phones yet. The verify endpoint will check against a temporary store.
            // But that requires a separate collection or Redis.
            //
            // Simplest correct approach: Store the OTP hash + expiry + phone in the
            // User collection as an incomplete record. Mark with isVerified=false.
            // If verify succeeds with name+role, complete the record.
            // If verify is never called, the record sits as an incomplete zombie
            // (can be cleaned up periodically).

            await UserModel.create({
                phone,
                otp: hashedOtp,
                otpExpiresAt: expiresAt,
                otpAttempts: 0,
                name: 'Pending Verification', // Placeholder — updated on verify
                isVerified: false,
                isActive: false, // Inactive until verified
            });
        }

        // Send OTP via SMS
        const smsProvider = getSmsProvider();
        const message =
            purpose === 'auth'
                ? `Your TruckNet login OTP is: ${otp}. Valid for ${OTP_EXPIRY_MS / 60000} minutes. Do not share.`
                : `You've been invited to drive on TruckNet. Your confirmation OTP is: ${otp}. Valid for ${OTP_EXPIRY_MS / 60000} minutes.`;

        await smsProvider.sendSms(phone, message);
        logger.info('OTP sent', { phone, purpose });
    }

    /**
     * Verify an OTP for a phone number.
     * Returns the user document if valid.
     * Throws if invalid, expired, or max attempts exceeded.
     */
    async verifyOtp(phone: string, otpCode: string): Promise<{ userId: string; isNewUser: boolean }> {
        const user = await UserModel.findOne({ phone })
            .select('+otp +otpExpiresAt +otpAttempts');

        if (!user) {
            throw new AppError('No OTP was sent to this number', 400);
        }

        // Check if OTP exists
        if (!user.otp || !user.otpExpiresAt) {
            throw new AppError('No active OTP for this number. Please request a new one.', 400);
        }

        // Check expiry
        if (user.otpExpiresAt < new Date()) {
            // Clear expired OTP
            await UserModel.updateOne(
                { _id: user._id },
                { $unset: { otp: 1, otpExpiresAt: 1 }, $set: { otpAttempts: 0 } }
            );
            throw new AppError('OTP has expired. Please request a new one.', 400);
        }

        // Check max attempts
        if ((user.otpAttempts || 0) >= MAX_OTP_ATTEMPTS) {
            await UserModel.updateOne(
                { _id: user._id },
                { $unset: { otp: 1, otpExpiresAt: 1 }, $set: { otpAttempts: 0 } }
            );
            throw new AppError('Too many failed attempts. Please request a new OTP.', 429);
        }

        // Verify OTP hash
        const hashedInput = this.hashOtp(otpCode);
        if (hashedInput !== user.otp) {
            await UserModel.updateOne(
                { _id: user._id },
                { $inc: { otpAttempts: 1 } }
            );
            const remaining = MAX_OTP_ATTEMPTS - ((user.otpAttempts || 0) + 1);
            throw new AppError(
                `Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`,
                400
            );
        }

        // OTP is valid — clear it
        await UserModel.updateOne(
            { _id: user._id },
            { $unset: { otp: 1, otpExpiresAt: 1 }, $set: { otpAttempts: 0 } }
        );

        // Determine if this is a new user (created by sendOtp as a placeholder)
        const isNewUser = !user.isActive && !user.isVerified;

        logger.info('OTP verified', { phone, userId: user._id.toString(), isNewUser });
        return { userId: user._id.toString(), isNewUser };
    }
}
