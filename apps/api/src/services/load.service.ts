import { LoadModel, isValidTransition } from '../models/mongoose/Load';
import { DriverProfileModel } from '../models/mongoose/DriverProfile';
import { OwnerProfileModel } from '../models/mongoose/OwnerProfile';
import { AppError } from '../utils/AppError';
import { validateObjectId } from '../utils/validateId';
import { parsePagination, PaginatedResult } from '../utils/pagination';
import { logger } from '../utils/logger';

// ── Configurable expiration timeout (ms) ──
const ACCEPTED_LOAD_EXPIRY_MS = parseInt(process.env.LOAD_EXPIRY_MS || '86400000', 10); // 24h default

export class LoadService {

    // ───────────────────────────────────────
    //  CUSTOMER: Post a new load
    // ───────────────────────────────────────
    async createLoad(customerId: string, data: {
        source: string;
        destination: string;
        weight: number;
        goodsType: string;
        price: number;
        distance?: number;
        vehicleType?: string;
        description?: string;
        pickupLat?: number;
        pickupLng?: number;
        dropLat?: number;
        dropLng?: number;
    }) {
        const load = await LoadModel.create({
            ...data,
            customerId,
            status: 'OPEN',
            auditTrail: [{ action: 'CREATED', toStatus: 'OPEN', userId: customerId }],
        });

        logger.info('Load created', { loadId: load._id, customerId });
        return load;
    }

    // ───────────────────────────────────────
    //  OWNER: Browse available OPEN loads (paginated)
    // ───────────────────────────────────────
    async getOpenLoads(query: Record<string, any> = {}): Promise<PaginatedResult<any>> {
        const { skip, limit, sort, page } = parsePagination(query);

        const filter = { status: 'OPEN' };
        const [data, total] = await Promise.all([
            LoadModel.find(filter)
                .populate('customerId', 'name email phone')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .select('-auditTrail')
                .lean(),
            LoadModel.countDocuments(filter),
        ]);

        return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    // ───────────────────────────────────────
    //  OWNER: Accept a load (ATOMIC)
    // ───────────────────────────────────────
    async acceptLoad(ownerId: string, loadId: string) {
        validateObjectId(loadId, 'loadId');

        const ownerProfile = await OwnerProfileModel.findOne({ userId: ownerId });
        if (!ownerProfile) throw new AppError('Owner profile not found', 404);

        // Atomic acceptance — only succeeds if status is still OPEN
        const load = await LoadModel.findOneAndUpdate(
            { _id: loadId, status: 'OPEN', isDeleted: { $ne: true } },
            {
                $set: {
                    status: 'ACCEPTED_BY_OWNER',
                    ownerId: ownerProfile._id,
                    acceptedAt: new Date(),
                },
                $push: {
                    auditTrail: {
                        action: 'ACCEPTED',
                        fromStatus: 'OPEN',
                        toStatus: 'ACCEPTED_BY_OWNER',
                        userId: ownerId,
                        timestamp: new Date(),
                    },
                },
            },
            { new: true }
        );

        if (!load) {
            throw new AppError('Load is no longer available or does not exist', 409);
        }

        logger.info('Load accepted', { loadId, ownerId });
        return load;
    }

    // ───────────────────────────────────────
    //  OWNER: Assign a driver to an accepted load
    // ───────────────────────────────────────
    async assignDriver(ownerId: string, loadId: string, driverProfileId: string) {
        validateObjectId(loadId, 'loadId');
        validateObjectId(driverProfileId, 'driverProfileId');

        const ownerProfile = await OwnerProfileModel.findOne({ userId: ownerId });
        if (!ownerProfile) throw new AppError('Owner profile not found', 404);

        // Verify driver exists
        const driverProfile = await DriverProfileModel.findById(driverProfileId);
        if (!driverProfile) throw new AppError('Driver not found', 404);

        // Guard: driver must not already have an active load
        const activeDriverLoad = await LoadModel.findOne({
            driverId: driverProfile._id,
            status: { $in: ['ASSIGNED_TO_DRIVER', 'IN_TRANSIT'] },
            isDeleted: { $ne: true },
        });
        if (activeDriverLoad) {
            throw new AppError('This driver already has an active load assignment', 409);
        }

        // Atomic assignment — only if status=ACCEPTED_BY_OWNER and ownerId matches
        const load = await LoadModel.findOneAndUpdate(
            {
                _id: loadId,
                status: 'ACCEPTED_BY_OWNER',
                ownerId: ownerProfile._id,
                driverId: { $exists: false },  // prevent double assignment
                isDeleted: { $ne: true },
            },
            {
                $set: {
                    status: 'ASSIGNED_TO_DRIVER',
                    driverId: driverProfile._id,
                    assignedAt: new Date(),
                },
                $push: {
                    auditTrail: {
                        action: 'DRIVER_ASSIGNED',
                        fromStatus: 'ACCEPTED_BY_OWNER',
                        toStatus: 'ASSIGNED_TO_DRIVER',
                        userId: ownerId,
                        timestamp: new Date(),
                        meta: { driverProfileId },
                    },
                },
            },
            { new: true }
        );

        if (!load) {
            throw new AppError('Load is not in assignable state, does not belong to you, or already has a driver', 409);
        }

        logger.info('Driver assigned to load', { loadId, driverProfileId, ownerId });
        return load;
    }

    // ───────────────────────────────────────
    //  DRIVER: View loads assigned to me (paginated)
    // ───────────────────────────────────────
    async getDriverLoads(userId: string, query: Record<string, any> = {}): Promise<PaginatedResult<any>> {
        const driverProfile = await DriverProfileModel.findOne({ userId });
        if (!driverProfile) throw new AppError('Driver profile not found', 404);

        const { skip, limit, sort, page } = parsePagination(query);
        const filter = { driverId: driverProfile._id };

        const [data, total] = await Promise.all([
            LoadModel.find(filter)
                .populate('customerId', 'name email phone')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .select('-auditTrail')
                .lean(),
            LoadModel.countDocuments(filter),
        ]);

        return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    // ───────────────────────────────────────
    //  DRIVER: Update load status (strict transitions)
    // ───────────────────────────────────────
    async updateLoadStatus(userId: string, loadId: string, newStatus: 'IN_TRANSIT' | 'COMPLETED') {
        validateObjectId(loadId, 'loadId');

        const driverProfile = await DriverProfileModel.findOne({ userId });
        if (!driverProfile) throw new AppError('Driver profile not found', 404);

        const load = await LoadModel.findById(loadId);
        if (!load) throw new AppError('Load not found', 404);

        // Ownership check
        if (!load.driverId || load.driverId.toString() !== driverProfile._id.toString()) {
            throw new AppError('This load is not assigned to you', 403);
        }

        // Strict transition validation
        if (!isValidTransition(load.status, newStatus)) {
            throw new AppError(`Invalid transition: ${load.status} → ${newStatus}`, 400);
        }

        // Atomic status update with version check (optimistic concurrency)
        const updateFields: any = { status: newStatus };
        if (newStatus === 'COMPLETED') updateFields.completedAt = new Date();

        const updated = await LoadModel.findOneAndUpdate(
            { _id: loadId, status: load.status, __v: load.__v },
            {
                $set: updateFields,
                $inc: { __v: 1 },
                $push: {
                    auditTrail: {
                        action: `STATUS_${newStatus}`,
                        fromStatus: load.status,
                        toStatus: newStatus,
                        userId,
                        timestamp: new Date(),
                    },
                },
            },
            { new: true }
        );

        if (!updated) {
            throw new AppError('Concurrent update detected, please retry', 409);
        }

        logger.info('Load status updated', { loadId, from: load.status, to: newStatus, userId });
        return updated;
    }

    // ───────────────────────────────────────
    //  CUSTOMER: View my loads (paginated)
    // ───────────────────────────────────────
    async getCustomerLoads(customerId: string, query: Record<string, any> = {}): Promise<PaginatedResult<any>> {
        const { skip, limit, sort, page } = parsePagination(query);
        const filter = { customerId };

        const [data, total] = await Promise.all([
            LoadModel.find(filter)
                .populate('ownerId', 'companyName')
                .populate('driverId', 'licenseNumber rating')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .select('-auditTrail')
                .lean(),
            LoadModel.countDocuments(filter),
        ]);

        return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    // ───────────────────────────────────────
    //  OWNER: View my accepted loads (paginated)
    // ───────────────────────────────────────
    async getOwnerLoads(ownerId: string, query: Record<string, any> = {}): Promise<PaginatedResult<any>> {
        const ownerProfile = await OwnerProfileModel.findOne({ userId: ownerId });
        if (!ownerProfile) throw new AppError('Owner profile not found', 404);

        const { skip, limit, sort, page } = parsePagination(query);
        const filter = { ownerId: ownerProfile._id };

        const [data, total] = await Promise.all([
            LoadModel.find(filter)
                .populate('customerId', 'name email phone')
                .populate('driverId', 'licenseNumber rating')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .select('-auditTrail')
                .lean(),
            LoadModel.countDocuments(filter),
        ]);

        return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    // ───────────────────────────────────────
    //  CUSTOMER: Cancel load (OPEN only)
    // ───────────────────────────────────────
    async cancelLoad(customerId: string, loadId: string) {
        validateObjectId(loadId, 'loadId');

        // Atomic cancel — only if OPEN and belongs to customer
        const load = await LoadModel.findOneAndUpdate(
            { _id: loadId, customerId, status: 'OPEN', isDeleted: { $ne: true } },
            {
                $set: { status: 'CANCELLED' },
                $push: {
                    auditTrail: {
                        action: 'CANCELLED',
                        fromStatus: 'OPEN',
                        toStatus: 'CANCELLED',
                        userId: customerId,
                        timestamp: new Date(),
                    },
                },
            },
            { new: true }
        );

        if (!load) {
            throw new AppError('Load cannot be cancelled (not OPEN or not yours)', 409);
        }

        logger.info('Load cancelled', { loadId, customerId });
        return load;
    }

    // ───────────────────────────────────────
    //  EXPIRATION: Revert stale accepted loads
    // ───────────────────────────────────────
    async expireStaleLoads() {
        const threshold = new Date(Date.now() - ACCEPTED_LOAD_EXPIRY_MS);

        const result = await LoadModel.updateMany(
            {
                status: 'ACCEPTED_BY_OWNER',
                acceptedAt: { $lt: threshold },
                isDeleted: { $ne: true },
            },
            {
                $set: { status: 'OPEN', ownerId: undefined, acceptedAt: undefined },
                $push: {
                    auditTrail: {
                        action: 'EXPIRED_REVERTED',
                        fromStatus: 'ACCEPTED_BY_OWNER',
                        toStatus: 'OPEN',
                        userId: 'SYSTEM',
                        timestamp: new Date(),
                    },
                },
            }
        );

        if (result.modifiedCount > 0) {
            logger.info('Expired stale loads', { count: result.modifiedCount });
        }
        return result.modifiedCount;
    }

    // ───────────────────────────────────────
    //  SOFT DELETE
    // ───────────────────────────────────────
    async softDeleteLoad(loadId: string, userId: string) {
        validateObjectId(loadId, 'loadId');

        const load = await LoadModel.findOneAndUpdate(
            { _id: loadId, status: { $in: ['OPEN', 'CANCELLED', 'COMPLETED'] } },
            {
                $set: { isDeleted: true, deletedAt: new Date() },
                $push: {
                    auditTrail: {
                        action: 'SOFT_DELETED',
                        userId,
                        timestamp: new Date(),
                    },
                },
            },
            { new: true }
        );

        if (!load) throw new AppError('Cannot delete active or non-existent load', 400);
        return load;
    }
}
