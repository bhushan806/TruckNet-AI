import { Request, Response, NextFunction } from 'express';
import { RideService } from '../services/ride.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { z } from 'zod';

const rideService = new RideService();

const estimateSchema = z.object({
    distance: z.number(),
    vehicleType: z.string(),
});

const bookingSchema = z.object({
    source: z.string(),
    destination: z.string(),
    distance: z.number(),
    price: z.number(),
    pickupLat: z.number(),
    pickupLng: z.number(),
    dropLat: z.number(),
    dropLng: z.number(),
    vehicleType: z.string(),
});

export const getEstimate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = estimateSchema.parse(req.body);
        const result = await rideService.getEstimate(data.distance, data.vehicleType);
        res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        next(error);
    }
};

export const bookRide = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const data = bookingSchema.parse(req.body);
        const result = await rideService.createBooking({
            ...data,
            customerId: req.user.id
        });
        res.status(201).json({ status: 'success', data: result });
    } catch (error) {
        next(error);
    }
};

export const acceptRide = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        // Get driver profile ID from user relation
        // The auth middleware includes driverProfile in user object
        const driverId = (req.user as any).driverProfile?.id;

        if (!driverId) {
            throw new Error('Driver profile not found');
        }

        const result = await rideService.acceptRide(id, driverId);
        res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        next(error);
    }
};

export const getAvailableRides = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await rideService.getAvailableRides();
        res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        next(error);
    }
};

export const assignDriver = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { driverId } = req.body;
        if (!driverId) throw new Error('Driver ID is required');

        const result = await rideService.assignDriver(id, driverId);
        res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        next(error);
    }
};

export const getDriverTasks = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // Get driver profile ID from user relation
        const driverId = (req.user as any).driverProfile?.id;
        if (!driverId) throw new Error('Driver profile not found');

        const result = await rideService.getDriverTasks(driverId);
        res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        next(error);
    }
};

export const getCustomerRides = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const customerId = req.user.id;
        const result = await rideService.getCustomerRides(customerId);
        res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        next(error);
    }
};
