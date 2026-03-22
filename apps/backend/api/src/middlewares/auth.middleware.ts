import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { UserModel } from '../models/mongoose/User';
import { DriverProfileModel } from '../models/mongoose/DriverProfile';
import { OwnerProfileModel } from '../models/mongoose/OwnerProfile';

export interface AuthRequest extends Request {
    user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next(new AppError('You are not logged in', 401));
        }

        const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };

        // Use Mongoose to find user
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

        // Map _id to id for frontend consistency
        req.user = {
            ...userDoc,
            id: userDoc._id.toString(),
            driverProfile: driverProfile ? { ...driverProfile, id: driverProfile._id.toString() } : null,
            ownerProfile: ownerProfile ? { ...ownerProfile, id: ownerProfile._id.toString() } : null,
        };

        next();
    } catch (error) {
        next(new AppError('Invalid token', 401));
    }
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

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
                ...userDoc,
                id: userDoc._id.toString(),
                driverProfile: driverProfile ? { ...driverProfile, id: driverProfile._id.toString() } : null,
                ownerProfile: ownerProfile ? { ...ownerProfile, id: ownerProfile._id.toString() } : null,
            };
        } else {
            req.user = undefined;
        }

        next();
    } catch (error) {
        // If token verification fails, still proceed but as an unauthenticated user
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
