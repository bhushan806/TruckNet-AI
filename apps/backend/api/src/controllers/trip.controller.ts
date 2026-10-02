// ── Trip Controller ──
// Handles trip lifecycle, contact credentials, real-time messaging, and booking locks.

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { TripService } from '../services/trip.service';
import { AppError } from '../utils/AppError';
import { z } from 'zod';

const tripService = new TripService();

// ── Validation Schemas ──

const checkpointSchema = z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
});

const bookTripSchema = z.object({
    loadId: z.string().min(1, 'loadId is required'),
    vehicleId: z.string().min(1, 'vehicleId is required'),
});

const messageSchema = z.object({
    content: z.string().min(1, 'Message content cannot be empty').max(2000),
    messageType: z.enum(['TEXT', 'QUICK_STATUS', 'ALERT']).optional().default('TEXT'),
});

// ── Controllers ──

// Book a trip (Owner accepts match or direct booking) with anti-overlap lock
export const bookTrip = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) return next(new AppError('User not authenticated', 401));

        const { loadId, vehicleId } = bookTripSchema.parse(req.body);
        const trip = await tripService.createFromMatch(userId, loadId, vehicleId);

        res.status(201).json({
            status: 'success',
            message: 'Trip booked successfully with anti-overlapping protection',
            data: trip,
        });
    } catch (error) {
        next(error);
    }
};

// Driver: Confirm pickup
export const confirmPickup = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) return next(new AppError('User not authenticated', 401));

        const { lat, lng } = checkpointSchema.parse(req.body);
        const trip = await tripService.confirmPickup(req.params.tripId, userId, lat, lng);

        res.status(200).json({
            status: 'success',
            message: 'Pickup confirmed',
            data: trip,
        });
    } catch (error) {
        next(error);
    }
};

// Driver: Start transit
export const startTransit = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) return next(new AppError('User not authenticated', 401));

        const { lat, lng } = checkpointSchema.parse(req.body);
        const trip = await tripService.startTransit(req.params.tripId, userId, lat, lng);

        res.status(200).json({
            status: 'success',
            message: 'Transit started',
            data: trip,
        });
    } catch (error) {
        next(error);
    }
};

// Driver: Confirm delivery
export const confirmDelivery = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) return next(new AppError('User not authenticated', 401));

        const { lat, lng } = checkpointSchema.parse(req.body);
        const trip = await tripService.confirmDelivery(req.params.tripId, userId, lat, lng);

        res.status(200).json({
            status: 'success',
            message: 'Delivery confirmed',
            data: trip,
        });
    } catch (error) {
        next(error);
    }
};

// Owner: Complete trip
export const completeTrip = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) return next(new AppError('User not authenticated', 401));

        const { lat, lng } = checkpointSchema.parse(req.body);
        const trip = await tripService.completeTrip(req.params.tripId, userId, lat, lng);

        res.status(200).json({
            status: 'success',
            message: 'Trip completed and vehicle released',
            data: trip,
        });
    } catch (error) {
        next(error);
    }
};

// List trips (Owner, Driver, Customer, Admin)
export const getMyTrips = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        const role = req.user?.role;
        if (!userId) return next(new AppError('User not authenticated', 401));

        let trips;
        if (role === 'OWNER') {
            trips = await tripService.getTripsByOwner(userId);
        } else if (role === 'DRIVER') {
            trips = await tripService.getTripsByDriver(userId);
        } else if (role === 'CUSTOMER') {
            trips = await tripService.getTripsByCustomer(userId);
        } else {
            const [ownerTrips, driverTrips, customerTrips] = await Promise.all([
                tripService.getTripsByOwner(userId),
                tripService.getTripsByDriver(userId),
                tripService.getTripsByCustomer(userId),
            ]);
            const seen = new Set<string>();
            trips = [];
            for (const t of [...ownerTrips, ...driverTrips, ...customerTrips]) {
                const id = (t._id as any).toString();
                if (!seen.has(id)) {
                    seen.add(id);
                    trips.push(t);
                }
            }
        }

        res.status(200).json({
            status: 'success',
            message: 'Trips fetched',
            data: trips,
        });
    } catch (error) {
        next(error);
    }
};

// Get trip detail
export const getTripById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) return next(new AppError('User not authenticated', 401));

        const trip = await tripService.getTripById(req.params.tripId);

        const isOwner = (trip.ownerId as any)?._id?.toString() === userId || (trip.ownerId as any)?.toString() === userId;
        const isDriver = (trip.driverId as any)?._id?.toString() === userId || (trip.driverId as any)?.toString() === userId;
        const isCustomer = (trip.loadId as any)?.customerId?._id?.toString() === userId || (trip.loadId as any)?.customerId?.toString() === userId;
        const isAdmin = req.user?.role === 'ADMIN';

        if (!isOwner && !isDriver && !isCustomer && !isAdmin) {
            throw new AppError('You are not authorized to view this trip', 403);
        }

        res.status(200).json({
            status: 'success',
            data: trip,
        });
    } catch (error) {
        next(error);
    }
};

// Get verified contact cards (Call, WhatsApp, chat info)
export const getTripContactInfo = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) return next(new AppError('User not authenticated', 401));

        const contact = await tripService.getTripContactInfo(req.params.tripId, userId);

        res.status(200).json({
            status: 'success',
            data: contact,
        });
    } catch (error) {
        next(error);
    }
};

// Lookup trip & contact by Load ID, loadNumber, or transactionId
export const getTripByLoad = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) return next(new AppError('User not authenticated', 401));

        const result = await tripService.getTripByLoadIdentifier(req.params.identifier, userId);

        res.status(200).json({
            status: 'success',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// Get trip chat messages
export const getTripMessages = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) return next(new AppError('User not authenticated', 401));

        const messages = await tripService.getTripMessages(req.params.tripId, userId);

        res.status(200).json({
            status: 'success',
            data: messages,
        });
    } catch (error) {
        next(error);
    }
};

// Send real-time trip message
export const sendTripMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) return next(new AppError('User not authenticated', 401));

        const { content, messageType } = messageSchema.parse(req.body);
        const message = await tripService.sendTripMessage(req.params.tripId, userId, content, messageType);

        res.status(201).json({
            status: 'success',
            message: 'Message sent',
            data: message,
        });
    } catch (error) {
        next(error);
    }
};

// ── Statutory Indian Transportation Documents (Bilty / LR, Transit Pass, POD) ──

export const getTripDocuments = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) return next(new AppError('User not authenticated', 401));

        const { TripDocumentService } = await import('../services/trip-document.service');
        const docService = new TripDocumentService();
        const docs = await docService.getDocumentsByTripId(req.params.tripId, userId);

        res.status(200).json({
            status: 'success',
            data: docs,
        });
    } catch (error) {
        next(error);
    }
};

export const getTripDocumentById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) return next(new AppError('User not authenticated', 401));

        const { TripDocumentService } = await import('../services/trip-document.service');
        const docService = new TripDocumentService();
        const doc = await docService.getDocumentById(req.params.docId, userId);

        res.status(200).json({
            status: 'success',
            data: doc,
        });
    } catch (error) {
        next(error);
    }
};

export const getDocumentsByLoad = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) return next(new AppError('User not authenticated', 401));

        const { TripDocumentService } = await import('../services/trip-document.service');
        const docService = new TripDocumentService();
        const docs = await docService.getDocumentsByLoadIdentifier(req.params.identifier, userId);

        res.status(200).json({
            status: 'success',
            data: docs,
        });
    } catch (error) {
        next(error);
    }
};

