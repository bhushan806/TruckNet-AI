// ── Auth Middleware ──
// SECURITY FIXES:
//   - select('-password -passwordResetToken -passwordResetExpires') on every user query
//   - Reads access token from HTTP-only cookie FIRST, falls back to Authorization header
//   - Profile queries run in parallel (not sequential) for performance
//   - AuthRequest interface strongly typed (no more any for user)

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { UserModel } from '../models/mongoose/User';
import { DriverProfileModel } from '../models/mongoose/DriverProfile';
import { OwnerProfileModel } from '../models/mongoose/OwnerProfile';

// ── Strongly typed user on request ──
export interface AuthenticatedUser {
    id: string;
    email: string;
    phone?: string;
    name: string;
    role: 'CUSTOMER' | 'DRIVER' | 'OWNER' | 'ADMIN';
    isVerified: boolean;
    isActive: boolean;
    avatar?: string;
    driverProfile: any | null;
    ownerProfile: any | null;
}

export interface AuthRequest extends Request {
    user?: AuthenticatedUser;
}

/**
 * Extract bearer token from HTTP-only cookie (priority) or Authorization header (fallback).
 * Cookie is preferred for browser clients; header fallback supports mobile/API clients.
 */
function extractToken(req: Request): string | null {
    // 1. HTTP-only cookie (set by login endpoint) — preferred, XSS-resistant
    const cookieToken = (req as any).cookies?.access_token;
    if (cookieToken) return cookieToken;

    // 2. Authorization: Bearer <token> — fallback for mobile/API clients
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }

    return null;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = extractToken(req);
        if (!token) return next(new AppError('You are not logged in', 401));

        let decoded: { userId: string };
        try {
            decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
        } catch {
            return next(new AppError('Invalid or expired token. Please log in again.', 401));
        }

        // FIX: Exclude password and sensitive fields from all auth queries
        const userDoc = await UserModel.findById(decoded.userId)
            .select('-password -passwordResetToken -passwordResetExpires -loginAttempts -lockUntil')
            .lean();

        if (!userDoc) {
            return next(new AppError('The user belonging to this token no longer exists', 401));
        }

        if (!(userDoc as any).isActive) {
            return next(new AppError('Your account has been deactivated. Contact support.', 403));
        }

        // Fetch role-specific profiles in parallel
        const [driverProfile, ownerProfile] = await Promise.all([
            (userDoc as any).role === 'DRIVER'
                ? DriverProfileModel.findOne({ userId: userDoc._id }).lean()
                : null,
            (userDoc as any).role === 'OWNER'
                ? OwnerProfileModel.findOne({ userId: userDoc._id }).lean()
                : null,
        ]);

        req.user = {
            ...(userDoc as any),
            id: (userDoc._id as any).toString(),
            driverProfile: driverProfile
                ? { ...(driverProfile as any), id: (driverProfile._id as any).toString() }
                : null,
            ownerProfile: ownerProfile
                ? { ...(ownerProfile as any), id: (ownerProfile._id as any).toString() }
                : null,
        };

        next();
    } catch {
        next(new AppError('Invalid or expired token. Please log in again.', 401));
    }
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = extractToken(req);
        if (!token) {
            req.user = undefined;
            return next();
        }

        let decoded: { userId: string };
        try {
            decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
        } catch {
            req.user = undefined;
            return next();
        }

        const userDoc = await UserModel.findById(decoded.userId)
            .select('-password -passwordResetToken -passwordResetExpires -loginAttempts -lockUntil')
            .lean();

        if (userDoc && (userDoc as any).isActive) {
            const [driverProfile, ownerProfile] = await Promise.all([
                (userDoc as any).role === 'DRIVER'
                    ? DriverProfileModel.findOne({ userId: userDoc._id }).lean()
                    : null,
                (userDoc as any).role === 'OWNER'
                    ? OwnerProfileModel.findOne({ userId: userDoc._id }).lean()
                    : null,
            ]);

            req.user = {
                ...(userDoc as any),
                id: (userDoc._id as any).toString(),
                driverProfile: driverProfile
                    ? { ...(driverProfile as any), id: (driverProfile._id as any).toString() }
                    : null,
                ownerProfile: ownerProfile
                    ? { ...(ownerProfile as any), id: (ownerProfile._id as any).toString() }
                    : null,
            };
        } else {
            req.user = undefined;
        }

        next();
    } catch {
        req.user = undefined;
        next();
    }
};

export const authorize = (...roles: Array<'ADMIN' | 'OWNER' | 'DRIVER' | 'CUSTOMER'>) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role as any)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};
