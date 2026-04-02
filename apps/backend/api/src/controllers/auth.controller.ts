// ── Auth Controller ──
// FIX 5: Sets JWT as HTTP-only cookie on login/register.
//         Clears cookies on logout.
//         Also returns user payload in response body (no token in body for security).

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AuthService } from '../services/auth.service';
import { OtpService } from '../services/otp.service';
import { AppError } from '../utils/AppError';
import { z } from 'zod';

const authService = new AuthService();
const otpService = new OtpService();

// ── Validation Schemas ──

const registerSchema = z.object({
    email: z.string().email(),
    phone: z.string().min(10),
    password: z.string().min(6),
    name: z.string().min(2),
    role: z.enum(['DRIVER', 'OWNER', 'CUSTOMER']),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

const sendOtpSchema = z.object({
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Valid Indian 10-digit phone number required'),
});

const verifyOtpSchema = z.object({
    phone: z.string().regex(/^[6-9]\d{9}$/),
    otp: z.string().length(6, 'OTP must be 6 digits'),
    name: z.string().min(2).optional(),
    role: z.enum(['DRIVER', 'OWNER', 'CUSTOMER']).optional(),
});

// ── Cookie Helper ──
const COOKIE_OPTS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: (process.env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
};

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('access_token', accessToken, {
        ...COOKIE_OPTS,
        maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.cookie('refresh_token', refreshToken, {
        ...COOKIE_OPTS,
        path: '/api/auth/refresh',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
}

function clearAuthCookies(res: Response) {
    res.clearCookie('access_token', COOKIE_OPTS);
    res.clearCookie('refresh_token', { ...COOKIE_OPTS, path: '/api/auth/refresh' });
}

// ── Controllers ──

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = registerSchema.parse(req.body);
        const result = await authService.register(data);

        setAuthCookies(res, result.accessToken, result.refreshToken);

        res.status(201).json({
            status: 'success',
            message: 'Registration successful',
            data: {
                user: result.user,
                // Also send token in body for mobile clients that can't use cookies
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = loginSchema.parse(req.body);
        const result = await authService.login(data);

        setAuthCookies(res, result.accessToken, result.refreshToken);

        res.status(200).json({
            status: 'success',
            message: 'Login successful',
            data: {
                user: result.user,
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Read refresh token from cookie first, then body (for mobile)
        const refreshToken = (req as any).cookies?.refresh_token || req.body?.refreshToken;
        if (!refreshToken) throw new AppError('Refresh token required', 400);

        const result = await authService.refreshToken(refreshToken);

        setAuthCookies(res, result.accessToken, result.refreshToken);

        res.status(200).json({
            status: 'success',
            message: 'Token refreshed',
            data: {
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const logout = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) return next(new AppError('User not authenticated', 401));

        await authService.logout(userId);

        // FIX 5: Clear cookies on logout
        clearAuthCookies(res);

        res.status(200).json({ status: 'success', message: 'Logged out successfully' });
    } catch (error) {
        next(error);
    }
};

// ── FIX 7: Phone OTP Authentication ──

export const sendOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { phone } = sendOtpSchema.parse(req.body);
        await otpService.sendOtp(phone);
        res.status(200).json({
            status: 'success',
            message: 'OTP bhej diya gaya hai. 6-digit code check karo.',
        });
    } catch (error) {
        next(error);
    }
};

export const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { phone, otp, name, role } = verifyOtpSchema.parse(req.body);
        const result = await otpService.verifyOtpAndLogin(phone, otp, name, role);

        setAuthCookies(res, result.accessToken, result.refreshToken);

        res.status(200).json({
            status: 'success',
            message: result.isNewUser ? 'Welcome to TruckNet! 🚛' : 'Login successful!',
            data: {
                user: result.user,
                isNewUser: result.isNewUser,
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ── Existing Helpers ──

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return next(new AppError('Not authenticated', 401));
        res.status(200).json({ status: 'success', data: { user: req.user } });
    } catch (error) {
        next(error);
    }
};

export const getDrivers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await authService.getDrivers();
        res.status(200).json({ status: 'success', message: 'Drivers fetched', data: result });
    } catch (error) {
        next(error);
    }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;
        if (!email) throw new AppError('Email is required', 400);
        const result = await authService.forgotPassword(email);
        res.status(200).json({ status: 'success', message: result.message, data: result });
    } catch (error) {
        next(error);
    }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) throw new AppError('Token and new password are required', 400);
        const result = await authService.resetPassword(token, newPassword);
        res.status(200).json({ status: 'success', message: result.message });
    } catch (error) {
        next(error);
    }
};
