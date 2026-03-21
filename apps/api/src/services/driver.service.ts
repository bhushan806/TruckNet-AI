import { DriverProfileModel } from '../models/mongoose/DriverProfile';
import { ConnectionRequestModel } from '../models/mongoose/ConnectionRequest';
import { VehicleModel } from '../models/mongoose/Vehicle';
import { UserModel } from '../models/mongoose/User';
import { logger } from '../utils/logger';

export class DriverService {
    async getMyDrivers(ownerId: string) {
        try {
            // Find accepted connections
            const connections = await ConnectionRequestModel.find({
                ownerId,
                status: 'ACCEPTED'
            });

            const driverIds = connections.map(c => c.driverId);

            // Fetch driver profiles with user details
            const drivers = await DriverProfileModel.find({
                _id: { $in: driverIds }
            }).populate('userId', 'name email phone avatar');

            // Fetch assigned vehicles
            const vehicles = await VehicleModel.find({
                driverId: { $in: driverIds }
            });

            // Merge and format
            return drivers.map(driver => {
                const vehicle = vehicles.find(v => v.driverId?.toString() === driver._id.toString());
                return {
                    ...driver.toObject(),
                    id: driver._id.toString(),
                    user: driver.userId, // populated user details
                    vehicle: vehicle || null
                };
            });
        } catch (error) {
            logger.error('Error in getMyDrivers', { error: (error as any).message });
            throw error;
        }
    }

    async getProfile(userId: string) {
        try {
            let profile = await DriverProfileModel.findOne({ userId })
                .populate('userId', 'name email phone avatar');

            if (!profile) {
                // Auto-create profile for existing users
                profile = await DriverProfileModel.create({
                    userId,
                    licenseNumber: `PENDING-${Date.now()}`,
                    experienceYears: 0,
                    rating: 5.0,
                    totalTrips: 0
                });
                profile = await DriverProfileModel.findById(profile._id)
                    .populate('userId', 'name email phone avatar');
            }

            if (!profile) throw new Error('Failed to create/fetch profile');

            // Get vehicle
            const vehicle = await VehicleModel.findOne({ driverId: profile._id });

            return {
                ...profile.toObject(),
                id: profile._id.toString(),
                user: profile.userId,
                vehicle: vehicle || null
            };
        } catch (error) {
            logger.error('Error in DriverService.getProfile', { error: (error as any).message });
            throw error;
        }
    }

    async toggleStatus(userId: string) {
        const profile = await DriverProfileModel.findOne({ userId });

        if (!profile) {
            throw new Error('Driver profile not found');
        }

        const newStatus = !profile.isAvailable;

        await DriverProfileModel.findOneAndUpdate(
            { userId },
            { isAvailable: newStatus }
        );

        return { ...profile.toObject(), id: profile._id.toString(), isAvailable: newStatus };
    }

    async getAllDrivers() {
        const drivers = await DriverProfileModel.find()
            .populate('userId', 'name email phone avatar');

        const driverIds = drivers.map(d => d._id);
        const vehicles = await VehicleModel.find({ driverId: { $in: driverIds } });

        return drivers.map(d => {
            const vehicle = vehicles.find(v => v.driverId?.toString() === d._id.toString());
            return {
                ...d.toObject(),
                id: d._id.toString(),
                user: d.userId,
                vehicle: vehicle || null
            };
        });
    }
}
