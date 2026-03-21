import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { DriverService } from '../services/driver.service';

const driverService = new DriverService();

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
