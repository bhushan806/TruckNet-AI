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

export const getNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ status: 'error', message: 'User not authenticated' });
            return;
        }

        const driverProfile = await DriverProfileModel.findOne({ userId });

        const notifications: Array<{
            id: string;
            title: string;
            message: string;
            type: 'info' | 'alert' | 'success';
            read: boolean;
            createdAt: string;
        }> = [];

        if (driverProfile) {
            const { LoadModel } = await import('../models/mongoose/Load');
            const assignedLoads = await LoadModel.find({
                driverId: driverProfile._id,
                status: { $in: ['ASSIGNED_TO_DRIVER', 'IN_TRANSIT'] },
                isDeleted: { $ne: true },
            }).sort({ updatedAt: -1 }).limit(5).lean();

            for (const load of assignedLoads) {
                notifications.push({
                    id: `load_${load._id}`,
                    title: load.status === 'ASSIGNED_TO_DRIVER' ? 'New Load Assigned! 🚚' : 'Active Shipment In Transit 🛣️',
                    message: `Consignment from ${load.source} to ${load.destination} (${load.goodsType}, ${load.weight}T). Fare: ₹${load.price?.toLocaleString('en-IN')}.`,
                    type: load.status === 'ASSIGNED_TO_DRIVER' ? 'alert' : 'info',
                    read: false,
                    createdAt: (load as any).updatedAt ? new Date((load as any).updatedAt).toISOString() : new Date().toISOString(),
                });
            }

            if (!driverProfile.licenseNumber) {
                notifications.push({
                    id: 'doc_dl_pending',
                    title: 'Driving License Update Needed 📄',
                    message: 'Please complete your verified driver profile with your commercial license number for priority loads.',
                    type: 'alert',
                    read: false,
                    createdAt: new Date().toISOString(),
                });
            }
        }

        // Always include operational confirmation
        notifications.push({
            id: 'system_welcome',
            title: 'TruckNet 24/7 Operations Active 🛡️',
            message: 'Satellite telemetry and TruckNet Dost AI are ready. Have a safe journey on Indian highways!',
            type: 'info',
            read: true,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
        });

        res.status(200).json({ status: 'success', data: notifications });
    } catch (error) {
        next(error);
    }
};
