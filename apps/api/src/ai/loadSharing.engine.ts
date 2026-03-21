// ── AI Module: Dynamic Load Sharing Engine ──
// Reduces empty truck runs by intelligently combining partial loads.
// Uses Haversine clustering + direction vectors + greedy bin-packing.
// Called only via services layer, NEVER directly from routes.

import { logger } from '../utils/logger';

// ── Interfaces ──

export interface LoadItem {
    loadId: string;
    pickupLat: number;
    pickupLng: number;
    dropLat: number;
    dropLng: number;
    weight: number;          // in tonnes
    pickupCity?: string;
    dropCity?: string;
    timeWindowStart?: Date;  // earliest pickup
    timeWindowEnd?: Date;    // latest pickup
}

export interface TruckSlot {
    truckId: string;
    capacity: number;        // in tonnes
    currentLat: number;
    currentLng: number;
    routeLat?: number;       // destination lat (if en-route)
    routeLng?: number;       // destination lng (if en-route)
}

export interface LoadGroup {
    truckId: string;
    loads: LoadItem[];
    totalWeight: number;
    capacityUsed: number;    // percentage
    estimatedSavingsKm: number;
    routeSimilarityScore: number;
}

export interface LoadSharingResult {
    combinations: LoadGroup[];
    unassignedLoads: LoadItem[];
    totalSavingsKm: number;
}

// ── Helper: Haversine Distance (km) ──

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// ── Helper: Direction Vector Similarity (cosine similarity 0–1) ──

function directionSimilarity(load1: LoadItem, load2: LoadItem): number {
    // Direction vector = (dropLat - pickupLat, dropLng - pickupLng)
    const v1x = load1.dropLat - load1.pickupLat;
    const v1y = load1.dropLng - load1.pickupLng;
    const v2x = load2.dropLat - load2.pickupLat;
    const v2y = load2.dropLng - load2.pickupLng;

    const dot = v1x * v2x + v1y * v2y;
    const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
    const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);

    if (mag1 === 0 || mag2 === 0) return 0;
    return Math.max(0, dot / (mag1 * mag2)); // clamp to [0, 1]
}

// ── Helper: Time Window Compatibility ──

function timeWindowCompatible(load1: LoadItem, load2: LoadItem): boolean {
    // If either load has no time window, assume compatible
    if (!load1.timeWindowStart || !load1.timeWindowEnd) return true;
    if (!load2.timeWindowStart || !load2.timeWindowEnd) return true;

    // Windows overlap if one starts before the other ends
    return load1.timeWindowStart <= load2.timeWindowEnd &&
           load2.timeWindowStart <= load1.timeWindowEnd;
}

// ── Helper: Route Similarity Score (composite) ──

function routeSimilarity(load1: LoadItem, load2: LoadItem): number {
    // Pickup proximity (closer = better, max 50km reasonable)
    const pickupDist = haversineKm(load1.pickupLat, load1.pickupLng, load2.pickupLat, load2.pickupLng);
    const pickupScore = Math.max(0, 1 - pickupDist / 50);

    // Drop proximity
    const dropDist = haversineKm(load1.dropLat, load1.dropLng, load2.dropLat, load2.dropLng);
    const dropScore = Math.max(0, 1 - dropDist / 50);

    // Direction similarity
    const dirScore = directionSimilarity(load1, load2);

    // Weighted composite: 30% pickup proximity, 30% drop proximity, 40% direction
    return pickupScore * 0.3 + dropScore * 0.3 + dirScore * 0.4;
}

// ── Main: Optimize Load Sharing ──

/**
 * Groups partial loads into optimized truck combinations.
 * Uses greedy bin-packing with route-similarity scoring.
 *
 * Returns top 3 combinations sorted by savings.
 * Fallback: returns all loads as unassigned if optimization fails.
 */
export async function optimizeLoadSharing(
    loads: LoadItem[],
    trucks: TruckSlot[]
): Promise<LoadSharingResult> {
    try {
        if (!loads.length || !trucks.length) {
            return { combinations: [], unassignedLoads: loads, totalSavingsKm: 0 };
        }

        const assignedLoadIds = new Set<string>();
        const combinations: LoadGroup[] = [];

        // Sort trucks by capacity descending (fill biggest trucks first)
        const sortedTrucks = [...trucks].sort((a, b) => b.capacity - a.capacity);

        // Sort loads by weight descending (heaviest first for bin-packing)
        const sortedLoads = [...loads].sort((a, b) => b.weight - a.weight);

        for (const truck of sortedTrucks) {
            const group: LoadItem[] = [];
            let remainingCapacity = truck.capacity;

            for (const load of sortedLoads) {
                if (assignedLoadIds.has(load.loadId)) continue;
                if (load.weight > remainingCapacity) continue;

                // Check route similarity with existing loads in group
                if (group.length > 0) {
                    const avgSimilarity = group.reduce(
                        (sum, gl) => sum + routeSimilarity(gl, load), 0
                    ) / group.length;

                    // Minimum 0.3 similarity threshold to combine
                    if (avgSimilarity < 0.3) continue;

                    // Check time window compatibility with all grouped loads
                    const allCompatible = group.every(gl => timeWindowCompatible(gl, load));
                    if (!allCompatible) continue;
                }

                group.push(load);
                assignedLoadIds.add(load.loadId);
                remainingCapacity -= load.weight;
            }

            if (group.length > 0) {
                const totalWeight = group.reduce((s, l) => s + l.weight, 0);

                // Calculate route similarity score (average pairwise)
                let simScore = 1;
                if (group.length > 1) {
                    let pairCount = 0;
                    let simSum = 0;
                    for (let i = 0; i < group.length; i++) {
                        for (let j = i + 1; j < group.length; j++) {
                            simSum += routeSimilarity(group[i], group[j]);
                            pairCount++;
                        }
                    }
                    simScore = pairCount > 0 ? simSum / pairCount : 0;
                }

                // Estimate savings: combining N loads saves ~(N-1) * avg_pickup_distance km
                let savingsKm = 0;
                if (group.length > 1) {
                    for (let i = 1; i < group.length; i++) {
                        savingsKm += haversineKm(
                            group[0].pickupLat, group[0].pickupLng,
                            group[i].pickupLat, group[i].pickupLng
                        );
                    }
                }

                combinations.push({
                    truckId: truck.truckId,
                    loads: group,
                    totalWeight: Math.round(totalWeight * 100) / 100,
                    capacityUsed: Math.round((totalWeight / truck.capacity) * 100),
                    estimatedSavingsKm: Math.round(savingsKm),
                    routeSimilarityScore: Math.round(simScore * 100) / 100,
                });
            }
        }

        // Unassigned loads
        const unassigned = loads.filter(l => !assignedLoadIds.has(l.loadId));

        // Sort combinations by savings descending, return top 3
        combinations.sort((a, b) => b.estimatedSavingsKm - a.estimatedSavingsKm);
        const topCombinations = combinations.slice(0, 3);

        const totalSavingsKm = topCombinations.reduce((s, c) => s + c.estimatedSavingsKm, 0);

        logger.info('Load sharing optimization completed', {
            totalLoads: loads.length,
            groupsFormed: topCombinations.length,
            unassigned: unassigned.length,
            totalSavingsKm,
        });

        return { combinations: topCombinations, unassignedLoads: unassigned, totalSavingsKm };
    } catch (error: any) {
        logger.error('Load sharing optimization failed', { error: error.message });
        // Fallback: return all loads unassigned
        return { combinations: [], unassignedLoads: loads, totalSavingsKm: 0 };
    }
}
