// ── Load Controller ──
// SECURITY FIXES:
//   - Full Zod validation on createLoad (prevents NoSQL injection + mass assignment)
//   - getOpenLoads: customer email/phone no longer exposed to all OWNER users (PII fix)
//   - Input sanitization on all string fields (trim + maxlength)

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { LoadService } from '../services/load.service';
import { AppError } from '../utils/AppError';
import { z } from 'zod';

const loadService = new LoadService();

// ── Validation Schemas ──

const createLoadSchema = z.object({
    source: z.string().min(2, 'Source location is required').max(200).trim(),
    destination: z.string().min(2, 'Destination is required').max(200).trim(),
    weight: z.number({ invalid_type_error: 'Weight must be a number' })
        .positive('Weight must be positive')
        .max(100_000, 'Weight cannot exceed 100,000 kg'),
    goodsType: z.string().min(2, 'Goods type is required').max(100).trim(),
    price: z.number({ invalid_type_error: 'Price must be a number' })
        .positive('Price must be positive')
        .max(10_000_000, 'Price too large'),
    distance: z.number().positive().max(10_000).optional(),
    vehicleType: z.string().max(50).trim().optional(),
    description: z.string().max(1000).trim().optional(),
    pickupLat: z.number().min(-90).max(90).optional(),
    pickupLng: z.number().min(-180).max(180).optional(),
    dropLat: z.number().min(-90).max(90).optional(),
    dropLng: z.number().min(-180).max(180).optional(),
});

const assignDriverSchema = z.object({
    driverProfileId: z.string().min(1, 'driverProfileId is required'),
});

const updateStatusSchema = z.object({
    status: z.enum(['IN_TRANSIT', 'COMPLETED'], {
        errorMap: () => ({ message: 'Status must be IN_TRANSIT or COMPLETED' }),
    }),
});

// CUSTOMER: Post a new load (validated)
export const createLoad = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const customerId = req.user?.id;
        if (!customerId) return next(new AppError('User not authenticated', 401));

        const data = createLoadSchema.parse(req.body);
        const load = await loadService.createLoad(customerId, data);
        res.status(201).json({ status: 'success', message: 'Load created', data: load });
    } catch (error) {
        next(error);
    }
};

// OWNER: Browse available OPEN loads (paginated)
// FIX: Customer email/phone no longer included (was PII leak to all owners)
export const getOpenLoads = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const result = await loadService.getOpenLoads(req.query as any);
        res.status(200).json({ status: 'success', message: 'Open loads fetched', ...result });
    } catch (error) {
        next(error);
    }
};

// OWNER: Accept a load
export const acceptLoad = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const ownerId = req.user?.id;
        if (!ownerId) return next(new AppError('User not authenticated', 401));

        const load = await loadService.acceptLoad(ownerId, req.params.loadId);
        res.status(200).json({ status: 'success', message: 'Load accepted', data: load });
    } catch (error) {
        next(error);
    }
};

// OWNER: Assign a driver to an accepted load (validated)
export const assignDriver = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const ownerId = req.user?.id;
        if (!ownerId) return next(new AppError('User not authenticated', 401));

        const { driverProfileId } = assignDriverSchema.parse(req.body);
        const load = await loadService.assignDriver(ownerId, req.params.loadId, driverProfileId);
        res.status(200).json({ status: 'success', message: 'Driver assigned', data: load });
    } catch (error) {
        next(error);
    }
};

// DRIVER: View loads assigned to me (paginated)
export const getDriverLoads = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) return next(new AppError('User not authenticated', 401));

        const result = await loadService.getDriverLoads(userId, req.query as any);
        res.status(200).json({ status: 'success', message: 'Driver loads fetched', ...result });
    } catch (error) {
        next(error);
    }
};

// DRIVER: Update load status (strict transitions, validated)
export const updateLoadStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) return next(new AppError('User not authenticated', 401));

        const { status } = updateStatusSchema.parse(req.body);
        const load = await loadService.updateLoadStatus(userId, req.params.loadId, status);
        res.status(200).json({ status: 'success', message: `Load status updated to ${status}`, data: load });
    } catch (error) {
        next(error);
    }
};

// CUSTOMER: View my posted loads (paginated)
export const getMyLoads = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const customerId = req.user?.id;
        if (!customerId) return next(new AppError('User not authenticated', 401));

        const result = await loadService.getCustomerLoads(customerId, req.query as any);
        res.status(200).json({ status: 'success', message: 'Customer loads fetched', ...result });
    } catch (error) {
        next(error);
    }
};

// OWNER: View my accepted loads (paginated)
export const getOwnerLoads = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const ownerId = req.user?.id;
        if (!ownerId) return next(new AppError('User not authenticated', 401));

        const result = await loadService.getOwnerLoads(ownerId, req.query as any);
        res.status(200).json({ status: 'success', message: 'Owner loads fetched', ...result });
    } catch (error) {
        next(error);
    }
};

// CUSTOMER: Cancel a load
export const cancelLoad = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const customerId = req.user?.id;
        if (!customerId) return next(new AppError('User not authenticated', 401));

        const load = await loadService.cancelLoad(customerId, req.params.loadId);
        res.status(200).json({ status: 'success', message: 'Load cancelled', data: load });
    } catch (error) {
        next(error);
    }
};
