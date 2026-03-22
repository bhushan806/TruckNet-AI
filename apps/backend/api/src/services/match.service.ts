import { LoadModel } from '../models/mongoose/Load';
import { VehicleModel } from '../models/mongoose/Vehicle';
import { AppError } from '../utils/AppError';
import { validateObjectId } from '../utils/validateId';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import axios from 'axios';

const AI_TIMEOUT_MS = 5000;

export class MatchService {
    // Find AI-ranked driver matches for a load
    async findMatches(loadId: string) {
        validateObjectId(loadId, 'loadId');

        const load = await LoadModel.findById(loadId).lean();
        if (!load) throw new AppError('Load not found', 404);

        // Find available vehicles with enough capacity
        const vehicles = await VehicleModel.find({
            status: 'AVAILABLE',
            capacity: { $gte: load.weight },
        })
            .populate('driverId')
            .populate('ownerId')
            .lean();

        if (vehicles.length === 0) return [];

        // Build AI payload
        const loadForAi = {
            load_id: loadId,
            origin: { lat: load.pickupLat || 0, lng: load.pickupLng || 0 },
            destination: { lat: load.dropLat || 0, lng: load.dropLng || 0 },
            weight: load.weight,
            goods_type: load.goodsType,
        };

        const driversForAi = vehicles.map(v => ({
            driver_id: v.driverId?._id?.toString() || v._id.toString(),
            location: { lat: v.currentLat || 0, lng: v.currentLng || 0 },
            rating: (v.driverId as any)?.rating || 5.0,
            vehicle_type: v.type,
            is_available: true,
        }));

        // Try calling AI Engine (with timeout + fallback)
        let aiScoreMap = new Map<string, number>();
        try {
            const aiResponse = await axios.post(
                `${env.AI_ENGINE_URL}/match`,
                { load: loadForAi, available_drivers: driversForAi },
                { timeout: AI_TIMEOUT_MS }
            );

            if (aiResponse.data && Array.isArray(aiResponse.data)) {
                aiResponse.data.forEach((r: any) => {
                    let score = r.score || 0;
                    if (score > 1) score = score / 100;
                    aiScoreMap.set(r.driver_id, score);
                });
            }
        } catch (error: any) {
            logger.warn('AI Engine unavailable for matching, using fallback', { error: error.message });
        }

        // Build matches — AI score or fallback
        const matches = vehicles.map(vehicle => {
            const driverId = vehicle.driverId?._id?.toString() || vehicle._id.toString();
            const score = aiScoreMap.get(driverId) || Math.random() * 0.5 + 0.3;

            return {
                vehicleId: vehicle._id.toString(),
                vehicleNumber: vehicle.number,
                vehicleType: vehicle.type,
                capacity: vehicle.capacity,
                driverId,
                driverName: (vehicle.driverId as any)?.userId?.name || 'Unknown',
                driverRating: (vehicle.driverId as any)?.rating || 5.0,
                score: Math.round(score * 100) / 100,
            };
        });

        return matches.sort((a, b) => b.score - a.score);
    }

    // Accept a match: assign vehicle's driver to load
    async acceptMatch(loadId: string, vehicleId: string, ownerId: string) {
        validateObjectId(loadId, 'loadId');
        validateObjectId(vehicleId, 'vehicleId');

        const load = await LoadModel.findById(loadId);
        if (!load) throw new AppError('Load not found', 404);

        if (load.status !== 'ACCEPTED_BY_OWNER') {
            throw new AppError('Load must be in ACCEPTED_BY_OWNER status', 400);
        }

        const vehicle = await VehicleModel.findById(vehicleId);
        if (!vehicle) throw new AppError('Vehicle not found', 404);

        if (vehicle.driverId) {
            load.driverId = vehicle.driverId as any;
            load.status = 'ASSIGNED_TO_DRIVER';
            (load as any).assignedAt = new Date();
            await load.save();

            vehicle.status = 'ON_TRIP';
            await vehicle.save();

            logger.info('Match accepted', { loadId, vehicleId, ownerId });
        }

        return load;
    }
}
