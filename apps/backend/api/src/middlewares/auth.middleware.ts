// ── Auth Middleware ──
// FIX 5: Reads access token from HTTP-only cookie FIRST, falls back to Authorization header.
// This enables both cookie-based (browser) and Bearer token (mobile/API) auth simultaneously.

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { UserModel } from '../models/mongoose/User';
import { DriverProfileModel } from '../models/mongoose/DriverProfile';
import { OwnerProfileModel } from '../models/mongoose/OwnerProfile';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface AuthRequest extends Request {
    // Using any to avoid conflicts with Express's PassportJS user type declaration.
    // In practice req.user will always be of the shape set by our protect middleware.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user?: any;
}

/**
 * Extract bearer token from cookie (priority) or Authorization header (fallback).
 * This supports both cookie-based browser sessions and programmatic API access.
 */
function extractToken(req: Request): string | null {
    // 1. HTTP-only cookie (set by login endpoint) — preferred, secure
    const cookieToken = (req as any).cookies?.access_token;
    if (cookieToken) return cookieToken;

    // 2. Authorization: Bearer <token> header — fallback for mobile/API clients
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }

    return null;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = extractToken(req);

        if (!token) {
            return next(new AppError('You are not logged in', 401));
        }

        const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };

        const userDoc = await UserModel.findById(decoded.userId).lean();

        if (!userDoc) {
            return next(new AppError('The user belonging to this token no longer exists', 401));
        }

        // Fetch role-specific profiles
        let driverProfile = null;
        let ownerProfile = null;

        if (userDoc.role === 'DRIVER') {
            driverProfile = await DriverProfileModel.findOne({ userId: userDoc._id }).lean();
        } else if (userDoc.role === 'OWNER') {
            ownerProfile = await OwnerProfileModel.findOne({ userId: userDoc._id }).lean();
        }

        req.user = {
            ...userDoc as any,
            id: (userDoc._id as any).toString(),
            driverProfile: driverProfile ? { ...(driverProfile as any), id: (driverProfile._id as any).toString() } : null,
            ownerProfile: ownerProfile ? { ...(ownerProfile as any), id: (ownerProfile._id as any).toString() } : null,
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

        const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
        const userDoc = await UserModel.findById(decoded.userId).lean();

        if (userDoc) {
            let driverProfile = null;
            let ownerProfile = null;

            if (userDoc.role === 'DRIVER') {
                driverProfile = await DriverProfileModel.findOne({ userId: userDoc._id }).lean();
            } else if (userDoc.role === 'OWNER') {
                ownerProfile = await OwnerProfileModel.findOne({ userId: userDoc._id }).lean();
            }

            req.user = {
                ...(userDoc as any),
                id: (userDoc._id as any).toString(),
                driverProfile: driverProfile ? { ...(driverProfile as any), id: (driverProfile._id as any).toString() } : null,
                ownerProfile: ownerProfile ? { ...(ownerProfile as any), id: (ownerProfile._id as any).toString() } : null,
            };
        } else {
            req.user = undefined;
        }

        next();
    } catch {
        // Token verification failed — proceed as unauthenticated
        req.user = undefined;
        next();
    }
};

export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};
