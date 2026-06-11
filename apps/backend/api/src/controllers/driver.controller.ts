import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { DriverService } from '../services/driver.service';
import { UserModel } from '../models/mongoose/User';
import { DriverProfileModel } from '../models/mongoose/DriverProfile';
import { z } from 'zod';

const driverService = new DriverService();

const updateProfileSchema = z.object({
    name: z.string().min(2).max(100).trim().optional(),
    phone: z.string().min(7).max(15).trim().optional(),
    licenseNumber: z.string().trim().optional(),
    experience: z.number().int().min(0).max(60).optional(),
});

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) return next(new Error('User not authenticated'));

        const profile = await driverService.getProfile(userId);
        res.json({ status: 'success', data: profile });
    } catch (error) {
        next(error);
    }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) return next(new Error('User not authenticated'));

        const data = updateProfileSchema.parse(req.body);

        // Update name/phone on the User document
        if (data.name || data.phone) {
            await UserModel.findByIdAndUpdate(userId, {
                ...(data.name && { name: data.name }),
                ...(data.phone && { phone: data.phone }),
            });
        }

        // Update licenseNumber/experience on the DriverProfile document
        if (data.licenseNumber !== undefined || data.experience !== undefined) {
            await DriverProfileModel.findOneAndUpdate(
                { userId },
                {
                    ...(data.licenseNumber !== undefined && { licenseNumber: data.licenseNumber }),
                    ...(data.experience !== undefined && { experienceYears: data.experience }),
                }
            );
        }

        // Return refreshed profile
        const profile = await driverService.getProfile(userId);
        res.json({ status: 'success', data: profile });
    } catch (error) {
        next(error);
    }
};

export const toggleStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) return next(new Error('User not authenticated'));

        const profile = await driverService.toggleStatus(userId);
        res.json({ status: 'success', data: profile });
    } catch (error) {
        next(error);
    }
};

export const getAllDrivers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const drivers = await driverService.getAllDrivers();
        res.json({ status: 'success', data: drivers });
    } catch (error) {
        next(error);
    }
};

export const getMyDrivers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const ownerId = req.user?.id;
        if (!ownerId) return next(new Error('User not authenticated'));

        const drivers = await driverService.getMyDrivers(ownerId);
        res.json({ status: 'success', data: drivers });
    } catch (error) {
        next(error);
    }
};
