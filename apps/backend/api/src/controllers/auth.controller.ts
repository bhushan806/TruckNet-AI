// ── Auth Controller ──
// SECURITY FIXES:
//   - C-7:  Tokens NEVER returned in response body — HTTP-only cookies only
//   - SEC:  forgotPassword no longer returns reset token in response
//   - SEC:  Email enumeration prevented (same response for found/not found)
//   - SEC:  is_logged_in cookie is now server-set (HTTP-only) — not client-set
//   - SEC:  Strong password policy enforced (min 8, uppercase, number)
//   - SEC:  Reset token stored hashed, sent via email (not API response)

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AuthService } from '../services/auth.service';

import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { z } from 'zod';

const authService = new AuthService();


// ── Validation Schemas ──

const registerSchema = z.object({
    email: z.string().email('Valid email required').toLowerCase().trim(),
    phone: z.string()
        .regex(/^[6-9]\d{9}$/, 'Valid Indian 10-digit phone number required'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
    role: z.enum(['DRIVER', 'OWNER', 'CUSTOMER']),
});

const loginSchema = z.object({
    email: z.string().email('Valid email required').toLowerCase().trim(),
    password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
    email: z.string().email('Valid email required').toLowerCase().trim(),
});

const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
});

// ── Cookie Options ──
const IS_PROD = process.env.NODE_ENV === 'production';

const COOKIE_OPTS = {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: (IS_PROD ? 'none' : 'lax') as 'none' | 'lax',
};

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    // Access token: 15 minutes
    res.cookie('access_token', accessToken, {
        ...COOKIE_OPTS,
        maxAge: 15 * 60 * 1000,
    });
    // Refresh token: 7 days, path-restricted to refresh endpoint
    res.cookie('refresh_token', refreshToken, {
        ...COOKIE_OPTS,
        path: '/api/auth/refresh',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    // FIX: is_logged_in is now HTTP-only (server-set) — cannot be forged by client JS
    res.cookie('is_logged_in', '1', {
        ...COOKIE_OPTS,
        maxAge: 15 * 60 * 1000,
    });
}

function clearAuthCookies(res: Response) {
    const clearOpts = { ...COOKIE_OPTS, maxAge: 0 };
    res.clearCookie('access_token', clearOpts);
    res.clearCookie('refresh_token', { ...clearOpts, path: '/api/auth/refresh' });
    res.clearCookie('is_logged_in', clearOpts);
}

// ── Controllers ──

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = registerSchema.parse(req.body);
        const result = await authService.register(data);

        setAuthCookies(res, result.accessToken, result.refreshToken);

        // FIX C-7: NEVER return tokens in response body — they live in HTTP-only cookies
        res.status(201).json({
            status: 'success',
            message: 'Registration successful',
            data: { user: result.user },
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

        // FIX C-7: NEVER return tokens in response body
        res.status(200).json({
            status: 'success',
            message: 'Login successful',
            data: { user: result.user },
        });
    } catch (error) {
        next(error);
    }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Read refresh token from HTTP-only cookie only (no body fallback — security boundary)
        const refreshToken = (req as any).cookies?.refresh_token;
        if (!refreshToken) throw new AppError('Refresh token required', 401);

        const result = await authService.refreshToken(refreshToken);
        setAuthCookies(res, result.accessToken, result.refreshToken);

        // FIX C-7: No tokens in body
        res.status(200).json({
            status: 'success',
            message: 'Token refreshed',
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
        clearAuthCookies(res);

        res.status(200).json({ status: 'success', message: 'Logged out successfully' });
    } catch (error) {
        next(error);
    }
};

export const logoutAllDevices = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) return next(new AppError('User not authenticated', 401));

        await authService.logoutAllDevices(userId);
        clearAuthCookies(res);

        res.status(200).json({
            status: 'success',
            message: 'All devices logged out successfully',
        });
    } catch (error) {
        next(error);
    }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.user) return next(new AppError('Not authenticated', 401));
        res.status(200).json({ status: 'success', data: { user: req.user } });
    } catch (error) {
        next(error);
    }
};

// FIX: Added auth — was completely unauthenticated (High severity)
export const getDrivers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
        const result = await authService.getDrivers({ page, limit });
        res.status(200).json({ status: 'success', message: 'Drivers fetched', data: result });
    } catch (error) {
        next(error);
    }
};

// FIX: No longer returns reset token in response body (was critical leak)
// FIX: Same response for existing/non-existing email (prevents email enumeration)
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = forgotPasswordSchema.parse(req.body);
        // Service sends email internally — result always returns same message
        await authService.forgotPassword(email);

        // Always return same response regardless of whether email exists
        res.status(200).json({
            status: 'success',
            message: 'If that email is registered, a password reset link has been sent.',
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return next(new AppError('Valid email is required', 400));
        }
        // Even on error, return same message to prevent email enumeration
        logger.error('Forgot password error', { error: (error as any).message });
        res.status(200).json({
            status: 'success',
            message: 'If that email is registered, a password reset link has been sent.',
        });
    }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token, newPassword } = resetPasswordSchema.parse(req.body);
        await authService.resetPassword(token, newPassword);
        res.status(200).json({ status: 'success', message: 'Password updated successfully' });
    } catch (error) {
        next(error);
    }
};
