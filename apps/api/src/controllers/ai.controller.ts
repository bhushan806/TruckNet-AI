import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { logger } from '../utils/logger';
import { AiService } from '../services/ai.service';
import { UserModel } from '../models/mongoose/User';
import { DriverProfileModel } from '../models/mongoose/DriverProfile';
import { OwnerProfileModel } from '../models/mongoose/OwnerProfile';
import { VehicleModel } from '../models/mongoose/Vehicle';
import { RideModel } from '../models/mongoose/Ride';
import { LoadModel } from '../models/mongoose/Load';
import bcrypt from 'bcrypt';

const aiService = new AiService();

export const getInsights = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        let { role, userId } = req.body;

        if (!role || !userId) {
            res.status(400).json({ status: 'error', message: 'Role and User ID are required' });
            return;
        }

        logger.info('AI insights request', { role, userId });

        // Find user by email or id
        let user = null;
        if (userId.includes('@')) {
            user = await UserModel.findOne({ email: userId }).lean();
        } else {
            user = await UserModel.findById(userId).lean();
        }

        const dbUserId = user ? user._id.toString() : userId;

        // Gather context based on role
        let context: any = {};

        if (role === 'DRIVER') {
            const driverProfile = await DriverProfileModel.findOne({ userId: dbUserId });
            if (driverProfile) {
                const rides = await RideModel.find({ driverId: driverProfile._id, status: 'ONGOING' });
                context = {
                    driver_id: driverProfile._id.toString(),
                    rating: driverProfile.rating,
                    total_trips: driverProfile.totalTrips,
                    current_location: driverProfile.currentLat
                        ? { lat: driverProfile.currentLat, lng: driverProfile.currentLng }
                        : 'Mumbai',
                    destination: rides[0]?.destination || 'Pune',
                    current_earnings: 12000
                };
            } else {
                context = { current_location: 'Mumbai', destination: 'Pune', current_earnings: 4500 };
            }
        } else if (role === 'OWNER') {
            const ownerProfile = await OwnerProfileModel.findOne({ userId: dbUserId });
            if (ownerProfile) {
                const vehicles = await VehicleModel.find({ ownerId: ownerProfile._id });
                const idleCount = vehicles.filter(v => v.status === 'AVAILABLE').length;
                const maintenanceCount = vehicles.filter(v => v.status === 'MAINTENANCE').length;

                context = {
                    idle_truck_count: idleCount,
                    maintenance_count: maintenanceCount,
                    total_fleet_size: vehicles.length,
                    top_performing_vehicle: vehicles[0]?.number || 'NA'
                };
            } else {
                context = { idle_truck_count: 2, maintenance_count: 1 };
            }
        } else if (role === 'CUSTOMER') {
            const loads = await LoadModel.find({
                customerId: dbUserId,
                status: { $in: ['ACCEPTED_BY_OWNER', 'ASSIGNED_TO_DRIVER', 'IN_TRANSIT'] }
            });
            context = {
                active_shipments: loads.length,
                latest_shipment_status: loads[0]?.status || 'NO_ACTIVE_SHIPMENTS'
            };
        }

        const insights = await aiService.getInsights(role, dbUserId, context);
        res.status(200).json({ status: 'success', data: insights });
    } catch (error: any) {
        logger.error('AI controller error', { error: error.message });
        res.status(500).json({
            status: 'error',
            message: 'Internal Server Error',
        });
    }
};

export const seedData = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        logger.info('Seeding demo data via API');

        const hashedPassword = await bcrypt.hash('password123', 10);

        // 1. Create Demo Owner
        const ownerEmail = 'demo.owner@trucknet.in';
        let ownerUser = await UserModel.findOne({ email: ownerEmail });
        let newOwner = false;

        if (!ownerUser) {
            newOwner = true;
            ownerUser = await UserModel.create({
                email: ownerEmail,
                phone: '9876543210',
                password: hashedPassword,
                name: 'Rajesh Transports',
                role: 'OWNER'
            });

            await OwnerProfileModel.create({
                userId: ownerUser._id,
                companyName: 'Rajesh Transports Pvt Ltd'
            });
        }

        const ownerProfile = await OwnerProfileModel.findOne({ userId: ownerUser._id });

        if (ownerProfile && newOwner) {
            await VehicleModel.create([
                { number: 'MH-12-AB-1234', type: 'TRUCK_10T', status: 'AVAILABLE', ownerId: ownerProfile._id, capacity: 10 },
                { number: 'MH-14-XY-9876', type: 'TRUCK_10T', status: 'MAINTENANCE', ownerId: ownerProfile._id, capacity: 10 },
                { number: 'MH-04-JK-5555', type: 'TRUCK_20T', status: 'ON_TRIP', ownerId: ownerProfile._id, capacity: 20 }
            ]);
        }

        // 2. Create Demo Driver
        const driverEmail = 'demo.driver@trucknet.in';
        let driverUser = await UserModel.findOne({ email: driverEmail });

        if (!driverUser) {
            driverUser = await UserModel.create({
                email: driverEmail,
                phone: '9988776655',
                password: hashedPassword,
                name: 'Suresh Driver',
                role: 'DRIVER'
            });

            await DriverProfileModel.create({
                userId: driverUser._id,
                licenseNumber: 'MH-12-20220000123',
                experienceYears: 10,
                rating: 4.8,
                totalTrips: 60,
                currentLat: 19.0760,
                currentLng: 72.8777
            });
        }

        // 3. Create Demo Customer
        const customerEmail = 'demo.customer@trucknet.in';
        let customerUser = await UserModel.findOne({ email: customerEmail });

        if (!customerUser) {
            customerUser = await UserModel.create({
                email: customerEmail,
                phone: '9112233445',
                password: hashedPassword,
                name: 'Demo Customer',
                role: 'CUSTOMER'
            });
        }

        res.json({
            status: 'success',
            message: 'Database Seeded',
            data: {
                ownerId: ownerUser._id.toString(),
                driverId: driverUser._id.toString(),
                customerId: customerUser._id.toString()
            }
        });
    } catch (e) {
        next(e);
    }
};
