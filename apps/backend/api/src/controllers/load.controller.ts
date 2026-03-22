import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { LoadService } from '../services/load.service';
import { AppError } from '../utils/AppError';

const loadService = new LoadService();

// CUSTOMER: Post a new load
export const createLoad = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const customerId = req.user?.id;
        if (!customerId) return next(new AppError('User not authenticated', 401));

        const load = await loadService.createLoad(customerId, req.body);
        res.status(201).json({ status: 'success', message: 'Load created', data: load });
    } catch (error) {
        next(error);
    }
};

// OWNER: Browse available OPEN loads (paginated)
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

// OWNER: Assign a driver to an accepted load
export const assignDriver = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const ownerId = req.user?.id;
        if (!ownerId) return next(new AppError('User not authenticated', 401));

        const { driverProfileId } = req.body;
        if (!driverProfileId) {
            return res.status(400).json({ status: 'error', message: 'driverProfileId is required' });
        }

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

// DRIVER: Update load status (IN_TRANSIT / COMPLETED)
export const updateLoadStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) return next(new AppError('User not authenticated', 401));

        const { status } = req.body;
        if (!['IN_TRANSIT', 'COMPLETED'].includes(status)) {
            return res.status(400).json({ status: 'error', message: 'Invalid status. Must be IN_TRANSIT or COMPLETED' });
        }

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
