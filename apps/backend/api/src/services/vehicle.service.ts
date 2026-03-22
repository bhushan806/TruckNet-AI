import { VehicleModel } from '../models/mongoose/Vehicle';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

export class VehicleService {
    async createVehicle(data: {
        number: string;
        type: string;
        capacity: number;
        ownerId: string;
    }) {
        const vehicle = await VehicleModel.create({
            ...data,
            status: 'AVAILABLE'
        });

        return vehicle;
    }

    async getVehicles(filters?: { type?: string; status?: string }) {
        // Build Mongoose Query
        const query: any = {};
        if (filters?.type) query.type = filters.type;
        if (filters?.status) query.status = filters.status;

        return VehicleModel.find(query)
            .populate({
                path: 'ownerId',
                populate: { path: 'userId', select: 'name phone' }
            })
            .populate({
                path: 'driverId',
                populate: { path: 'userId', select: 'name phone' }
            })
            .sort({ createdAt: -1 });
    }

    async getVehicleById(id: string) {
        return VehicleModel.findById(id)
            .populate({
                path: 'ownerId',
                populate: { path: 'userId' }
            })
            .populate({
                path: 'driverId',
                populate: { path: 'userId' }
            });
    }

    async updateVehicle(id: string, data: { status?: string, capacity?: number, type?: string }) {
        const vehicle = await VehicleModel.findByIdAndUpdate(
            id,
            { $set: data },
            { new: true, runValidators: true }
        );

        if (!vehicle) {
            throw new AppError('Vehicle not found', 404);
        }

        return vehicle;
    }

    async updateLocation(id: string, lat: number, lng: number) {
        const updatedVehicle = await VehicleModel.findByIdAndUpdate(
            id,
            { currentLat: lat, currentLng: lng },
            { new: true }
        );

        // Emit socket event
        try {
            const { getIO } = await import('../config/socket');
            const io = getIO();
            if (updatedVehicle) {
                io.emit('vehicleUpdated', {
                    id: updatedVehicle._id,
                    ...updatedVehicle.toObject()
                });
            }
        } catch (error) {
            logger.error('Socket emission failed', { error: (error as any).message });
        }

        return updatedVehicle;
    }
}
