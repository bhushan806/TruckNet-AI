import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { UserModel } from '../models/mongoose/User';
import { DriverProfileModel } from '../models/mongoose/DriverProfile';
import { OwnerProfileModel } from '../models/mongoose/OwnerProfile';
import { RefreshTokenModel } from '../models/mongoose/RefreshToken';
import { logger } from '../utils/logger';

export class AuthService {
    // Generate access token (short-lived)
    private generateAccessToken(userId: string): string {
        return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: '15m' });
    }

    // Generate + store refresh token (long-lived, DB-backed)
    private async generateRefreshToken(userId: string): Promise<string> {
        const token = jwt.sign({ userId }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

        await RefreshTokenModel.create({
            token,
            userId,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        });

        return token;
    }

    // ── Register ──
    async register(data: { email: string; phone: string; password: string; name: string; role: string }) {
        const existingUser = await UserModel.findOne({
            $or: [{ email: data.email }, { phone: data.phone }]
        });
        if (existingUser) throw new AppError('Email or Phone already exists', 400);

        const hashedPassword = await bcrypt.hash(data.password, 10);
        const userDoc = await UserModel.create({ ...data, password: hashedPassword });

        try {
            if (data.role === 'DRIVER') {
                await DriverProfileModel.create({
                    userId: userDoc._id,
                    licenseNumber: `TEMP-${Date.now()}`,
                    experienceYears: 0,
                    rating: 5.0,
                    totalTrips: 0,
                });
            } else if (data.role === 'OWNER') {
                await OwnerProfileModel.create({
                    userId: userDoc._id,
                    companyName: `${userDoc.name}'s Transport`,
                });
            }
        } catch (error) {
            logger.error('Failed to create profile for user', { userId: userDoc._id });
        }

        const accessToken = this.generateAccessToken(userDoc._id.toString());
        const refreshToken = await this.generateRefreshToken(userDoc._id.toString());

        const user = {
            id: userDoc._id.toString(),
            name: userDoc.name,
            email: userDoc.email,
            role: userDoc.role,
            phone: userDoc.phone,
            avatar: userDoc.avatar,
        };

        logger.info('User registered', { userId: user.id, role: user.role });
        return { user, accessToken, refreshToken };
    }

    // ── Login ──
    async login(data: { email: string; password: string }) {
        const userDoc = await UserModel.findOne({ email: data.email });
        if (!userDoc || !(await bcrypt.compare(data.password, userDoc.password))) {
            throw new AppError('Invalid email or password', 401);
        }

        const accessToken = this.generateAccessToken(userDoc._id.toString());
        const refreshToken = await this.generateRefreshToken(userDoc._id.toString());

        const user = {
            id: userDoc._id.toString(),
            name: userDoc.name,
            email: userDoc.email,
            role: userDoc.role,
            phone: userDoc.phone,
            avatar: userDoc.avatar,
        };

        logger.info('User logged in', { userId: user.id });
        return { user, accessToken, refreshToken };
    }

    // ── Refresh Token (with rotation) ──
    async refreshToken(token: string) {
        let payload: any;
        try {
            payload = jwt.verify(token, env.JWT_REFRESH_SECRET);
        } catch {
            throw new AppError('Invalid or expired refresh token', 401);
        }

        // Find the token in DB and ensure it's not revoked
        const storedToken = await RefreshTokenModel.findOne({ token, isRevoked: false });
        if (!storedToken) {
            // Token reuse detected — revoke ALL tokens for this user (security breach)
            await RefreshTokenModel.updateMany({ userId: payload.userId }, { $set: { isRevoked: true } });
            logger.warn('Refresh token reuse detected, all tokens revoked', { userId: payload.userId });
            throw new AppError('Token has been revoked. Please login again.', 401);
        }

        // Revoke old token (rotation)
        storedToken.isRevoked = true;
        await storedToken.save();

        // Verify user still exists
        const user = await UserModel.findById(payload.userId);
        if (!user) throw new AppError('User not found', 401);

        // Issue new token pair
        const accessToken = this.generateAccessToken(user._id.toString());
        const refreshToken = await this.generateRefreshToken(user._id.toString());

        logger.info('Token rotated', { userId: user._id.toString() });
        return { accessToken, refreshToken };
    }

    // ── Logout (revoke all refresh tokens) ──
    async logout(userId: string) {
        await RefreshTokenModel.updateMany({ userId, isRevoked: false }, { $set: { isRevoked: true } });
        logger.info('User logged out, all tokens revoked', { userId });
        return { message: 'Logged out successfully' };
    }

    // ── Get available drivers ──
    async getDrivers() {
        const drivers = await DriverProfileModel.find({ isAvailable: true })
            .populate('userId', 'name email phone avatar');

        return drivers.map(d => ({
            ...d.toObject(),
            id: d._id.toString(),
            user: d.userId,
        }));
    }

    // ── Forgot password ──
    async forgotPassword(email: string) {
        const user = await UserModel.findOne({ email });
        if (!user) throw new AppError('User not found', 404);

        const resetToken = jwt.sign(
            { userId: user._id.toString(), type: 'reset' },
            env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        return { message: 'Password reset link sent', resetToken };
    }

    // ── Reset password ──
    async resetPassword(token: string, newPassword: string) {
        try {
            const payload = jwt.verify(token, env.JWT_SECRET) as any;
            if (payload.type !== 'reset') throw new Error('Invalid token type');

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await UserModel.findByIdAndUpdate(payload.userId, { password: hashedPassword });

            // Revoke all refresh tokens on password reset
            await RefreshTokenModel.updateMany({ userId: payload.userId }, { $set: { isRevoked: true } });

            return { message: 'Password updated successfully' };
        } catch {
            throw new AppError('Invalid or expired reset token', 400);
        }
    }
}
