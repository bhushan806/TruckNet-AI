// ── OTP Service ──
// SECURITY: Phone + OTP authentication for Indian truck drivers.
// Uses Fast2SMS API (free tier available for India).
// OTPs are bcrypt-hashed before storage.
// Max 3 requests per phone per 15 min (enforced by route-level limiter + DB count).
// Max 5 wrong attempts before lockout + immediate OTP deletion.
// CRITICAL FIX: Removed hardcoded fallback OTP '123456' — production always fails loudly.

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import axios from 'axios';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { UserModel } from '../models/mongoose/User';
import { OtpModel } from '../models/mongoose/Otp';
import { DriverProfileModel } from '../models/mongoose/DriverProfile';
import { OwnerProfileModel } from '../models/mongoose/OwnerProfile';
import { RefreshTokenModel } from '../models/mongoose/RefreshToken';
import { logger } from '../utils/logger';
import jwt from 'jsonwebtoken';

// Indian mobile number regex: starts with 6-9, exactly 10 digits
const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;

// Bcrypt rounds — higher in production for stronger hashing
const BCRYPT_ROUNDS = env.NODE_ENV === 'production' ? 12 : 10;

export class OtpService {
    // ── Generate a cryptographically random 6-digit OTP ──
    private generateOtp(): string {
        return String(crypto.randomInt(100000, 999999));
    }

    // ── Mask phone number for safe logging ──
    private maskPhone(phone: string): string {
        return phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2');
    }

    // ── Generate JWT tokens ──
    private generateAccessToken(userId: string): string {
        return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: '15m' });
    }

    private async generateRefreshToken(userId: string): Promise<string> {
        const rawToken = jwt.sign({ userId }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
        // Store SHA-256 hash of token — never plaintext
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
        await RefreshTokenModel.create({
            token: hashedToken,
            userId,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
        return rawToken; // Return raw token to client only
    }

    // ── Send OTP via Fast2SMS ──
    private async sendSms(phone: string, otp: string): Promise<void> {
        const apiKey = env.FAST2SMS_API_KEY;

        if (!apiKey) {
            // CRITICAL FIX: In development, log real OTP (never a hardcoded one).
            // In production, fail loudly — no fallback OTP ever.
            if (env.NODE_ENV !== 'production') {
                logger.warn(`[DEV-ONLY] OTP for ${this.maskPhone(phone)}: ${otp} — SMS not sent (no FAST2SMS_API_KEY)`);
                return;
            }
            // Production: throw so the user knows SMS is broken, not silently bypass auth
            throw new AppError(
                'SMS service is not configured. Please contact support or try email login.',
                503
            );
        }

        try {
            const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
                params: {
                    authorization: apiKey,
                    variables_values: otp,
                    route: 'otp',
                    numbers: phone,
                },
                timeout: 10_000,
            });

            if (!response.data?.return) {
                logger.error('Fast2SMS API returned failure', {
                    phone: this.maskPhone(phone),
                    response: response.data,
                });
                throw new AppError('Failed to send OTP. Please try again.', 503);
            }

            logger.info('OTP SMS sent successfully', { phone: this.maskPhone(phone) });
        } catch (error: any) {
            if (error instanceof AppError) throw error;
            logger.error('Fast2SMS call failed', { error: error.message });
            throw new AppError('SMS service temporarily unavailable. Please try again.', 503);
        }
    }

    // ── Send OTP to phone ──
    async sendOtp(phone: string): Promise<void> {
        if (!INDIAN_PHONE_REGEX.test(phone)) {
            throw new AppError('Valid Indian 10-digit phone number required (starts with 6-9)', 400);
        }

        // Rate limit: max 3 OTP requests per phone per 15 minutes
        const recentCount = await OtpModel.countDocuments({
            phone,
            createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) },
        });

        if (recentCount >= 3) {
            throw new AppError(
                '15 minute mein maximum 3 OTP bheje ja sakte hain. Thodi der baad try karo.',
                429
            );
        }

        const otp = this.generateOtp();

        // CRITICAL FIX: In production, SMS failure = hard failure. No fallback OTP.
        // In development, sendSms logs the OTP to console and returns without throwing.
        await this.sendSms(phone, otp);

        const hashedOtp = await bcrypt.hash(otp, BCRYPT_ROUNDS);

        // Delete any existing OTPs for this phone (single active OTP policy)
        await OtpModel.deleteMany({ phone });

        // Store hashed OTP with TTL of 10 minutes
        await OtpModel.create({
            phone,
            hashedOtp,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            attempts: 0,
        });
    }

    // ── Verify OTP and log user in (creates account if new user) ──
    async verifyOtpAndLogin(
        phone: string,
        otp: string,
        name?: string,
        role?: string
    ): Promise<{
        user: Record<string, unknown>;
        accessToken: string;
        refreshToken: string;
        isNewUser: boolean;
    }> {
        if (!INDIAN_PHONE_REGEX.test(phone)) {
            throw new AppError('Valid Indian 10-digit phone number required', 400);
        }

        const otpDoc = await OtpModel.findOne({ phone });

        if (!otpDoc) {
            throw new AppError('OTP nahi mila ya expire ho gaya. Dobara bhejne ki koshish karo.', 400);
        }

        if (otpDoc.expiresAt < new Date()) {
            await OtpModel.deleteOne({ phone });
            throw new AppError('OTP expire ho gaya. Dobara bhejne ki koshish karo.', 400);
        }

        // Max 5 attempts — delete on exhaustion to prevent timing attacks
        if (otpDoc.attempts >= 5) {
            await OtpModel.deleteOne({ phone });
            throw new AppError('Bahut zyada galat OTP. Dobara OTP request karo.', 429);
        }

        const isValid = await bcrypt.compare(otp, otpDoc.hashedOtp);

        if (!isValid) {
            otpDoc.attempts += 1;
            await otpDoc.save();
            const remaining = 5 - otpDoc.attempts;
            throw new AppError(
                `Galat OTP. ${remaining} aur try kar sakte hain.`,
                400
            );
        }

        // OTP verified — delete immediately (single-use, prevents replay attacks)
        await OtpModel.deleteOne({ phone });

        // Find or create user
        let userDoc = await UserModel.findOne({ phone });
        let isNewUser = false;

        if (!userDoc) {
            isNewUser = true;
            const resolvedName = name?.trim() || `User_${phone.slice(-4)}`;
            const resolvedRole = role || 'CUSTOMER';

            // Generate a cryptographically random password placeholder (user uses OTP only)
            const dummyPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), BCRYPT_ROUNDS);

            userDoc = await UserModel.create({
                phone,
                email: `otp_${phone}@trucknet.internal`, // Internal placeholder, never shown
                password: dummyPassword,
                name: resolvedName,
                role: resolvedRole,
                isVerified: true, // Phone verified via OTP
            });

            // Create role-specific profile
            try {
                if (resolvedRole === 'DRIVER') {
                    await DriverProfileModel.create({
                        userId: userDoc._id,
                        licenseNumber: `PENDING-${Date.now()}`, // Must be updated in profile setup
                        experienceYears: 0,
                        rating: 5.0,
                        totalTrips: 0,
                    });
                } else if (resolvedRole === 'OWNER') {
                    await OwnerProfileModel.create({
                        userId: userDoc._id,
                        companyName: `${resolvedName}'s Transport`,
                    });
                }
            } catch (profileError) {
                logger.error('Failed to create profile for OTP user', {
                    userId: (userDoc._id as any).toString(),
                });
            }

            logger.info('New user registered via OTP', {
                userId: (userDoc._id as any).toString(),
                role: resolvedRole,
            });
        }

        const accessToken = this.generateAccessToken((userDoc._id as any).toString());
        const refreshToken = await this.generateRefreshToken((userDoc._id as any).toString());

        const user = {
            id: (userDoc._id as any).toString(),
            name: userDoc.name,
            phone: userDoc.phone,
            email: userDoc.email,
            role: userDoc.role,
            avatar: userDoc.avatar,
        };

        logger.info('User logged in via OTP', { userId: user.id });
        return { user, accessToken, refreshToken, isNewUser };
    }
}
