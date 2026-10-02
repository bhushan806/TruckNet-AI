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

        // Build AI payload with full logistics context
        const sourceCity = (load as any).sourceCity || load.source?.split(',')[0]?.trim() || 'Mumbai';
        const destCity = (load as any).destinationCity || load.destination?.split(',')[0]?.trim() || 'Pune';

        const loadForAi = {
            load_id: loadId,
            origin: { lat: load.pickupLat || 19.0760, lng: load.pickupLng || 72.8777 },
            destination: { lat: load.dropLat || 18.5204, lng: load.dropLng || 73.8567 },
            weight: load.weight,
            goods_type: load.goodsType,
            origin_city: sourceCity,
            destination_city: destCity,
            required_body_type: (load as any).requiredBodyType || 'ANY',
            budget_price: load.price,
        };

        const driversForAi = vehicles.map(v => ({
            driver_id: v.driverId?._id?.toString() || v._id.toString(),
            location: {
                lat: v.currentLat ?? (v.location?.coordinates?.[1] ?? 19.0760),
                lng: v.currentLng ?? (v.location?.coordinates?.[0] ?? 72.8777)
            },
            rating: (v.driverId as any)?.rating || 5.0,
            vehicle_type: v.type,
            is_available: true,
            capacity: v.capacity,
            body_type: (v as any).bodyType || 'OPEN_HIGH_BED',
            home_city: (v as any).homeCity || 'Mumbai',
            base_rate_per_km: (v as any).baseRatePerKm || 25,
        }));

        // Try calling AI Engine (with timeout + deterministic fallback)
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
            logger.warn('AI Engine unavailable for matching, using deterministic logistics fallback', { error: error.message });
        }

        // Helper for deterministic Haversine distance in km
        const calculateDist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
            const R = 6371;
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        };

        // Build matches — AI score or deterministic logistics fallback
        const matches = vehicles.map(vehicle => {
            const driverId = vehicle.driverId?._id?.toString() || vehicle._id.toString();
            let score = aiScoreMap.get(driverId);

            if (score === undefined) {
                // Deterministic Logistics Scoring:
                // 1. Proximity to pickup (30%)
                const vLat = vehicle.currentLat ?? (vehicle.location?.coordinates?.[1] ?? 19.0760);
                const vLng = vehicle.currentLng ?? (vehicle.location?.coordinates?.[0] ?? 72.8777);
                const dist = calculateDist(loadForAi.origin.lat, loadForAi.origin.lng, vLat, vLng);
                const proxScore = dist < 15 ? 1.0 : dist < 50 ? 0.75 : dist < 100 ? 0.5 : 0.2;

                // 2. Capacity Fit (25%): Closer match to exact weight is best
                const cap = vehicle.capacity || 1;
                const utilRatio = Math.min(load.weight / cap, 1.0);
                const capScore = utilRatio >= 0.7 ? 1.0 : 0.7;

                // 3. Backhaul Bonus (30%): If truck's home city is destination
                const vHome = ((vehicle as any).homeCity || '').toLowerCase().trim();
                const dCity = destCity.toLowerCase().trim();
                const backhaulScore = (vHome && dCity && (vHome.includes(dCity) || dCity.includes(vHome))) ? 1.0 : 0.3;

                // 4. Rating (15%)
                const rating = (vehicle.driverId as any)?.rating || 4.5;
                const ratingScore = Math.min(rating / 5, 1.0);

                score = (proxScore * 0.30) + (capScore * 0.25) + (backhaulScore * 0.30) + (ratingScore * 0.15);
            }

            return {
                vehicleId: vehicle._id.toString(),
                vehicleNumber: vehicle.number,
                vehicleType: vehicle.type,
                bodyType: (vehicle as any).bodyType || 'OPEN_HIGH_BED',
                homeCity: (vehicle as any).homeCity || 'Mumbai',
                capacity: vehicle.capacity,
                driverId,
                driverName: (vehicle.driverId as any)?.userId?.name || 'Assigned Driver',
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
