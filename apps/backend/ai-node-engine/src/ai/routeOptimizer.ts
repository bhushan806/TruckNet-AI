// ── AI Module: Route Optimizer ──
// Provides route optimization logic for logistics operations.
// Called only via services layer, NEVER directly from routes.

import { logger } from '../utils/logger';

export interface RoutePoint {
    lat: number;
    lng: number;
    name: string;
}

export interface OptimizedRoute {
    route: RoutePoint[];
    estimatedTimeSavings: string;
    totalDistance: string;
    fuelEstimate: string;
    tollCost: number;
}

/**
 * Optimizes a route between origin and destination using traffic data
 * and road condition heuristics.
 *
 * In production, this would integrate with a mapping API (e.g., Google Maps,
 * MapMyIndia). Currently uses heuristic-based optimization.
 */
export async function optimizeRoute(
    origin: RoutePoint,
    destination: RoutePoint
): Promise<OptimizedRoute> {
    try {
        // Haversine distance approximation
        const R = 6371; // Earth's radius in km
        const dLat = (destination.lat - origin.lat) * Math.PI / 180;
        const dLon = (destination.lng - origin.lng) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(origin.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceKm = Math.round(R * c);

        // Fuel estimate (average 4 km/L for heavy trucks)
        const fuelLiters = Math.round(distanceKm / 4);
        const fuelCostPerLiter = 102; // INR

        // Toll estimate (rough: ₹1.5/km on highways)
        const tollCost = Math.round(distanceKm * 1.5);

        // Time savings estimate (10-15% over non-optimized route)
        const baseTimeHours = distanceKm / 45; // 45 km/h average
        const savingsMinutes = Math.round(baseTimeHours * 60 * 0.12); // 12% savings

        return {
            route: [origin, destination],
            estimatedTimeSavings: `${savingsMinutes} mins`,
            totalDistance: `${distanceKm} km`,
            fuelEstimate: `${fuelLiters}L (~₹${fuelLiters * fuelCostPerLiter})`,
            tollCost,
        };
    } catch (error: any) {
        logger.error('Route optimization failed', { error: error.message });
        throw error;
    }
}

// ── Advanced Route Intelligence (Upgrade) ──
// Returns 3 route options: Fastest, Cheapest, Balanced
// with toll estimation, traffic heuristics, and road quality flags.

export interface AdvancedRouteOption {
    label: 'Fastest' | 'Cheapest' | 'Balanced';
    route: RoutePoint[];
    distanceKm: number;
    estimatedTimeMinutes: number;
    tollEstimate: number;
    fuelEstimate: number;         // INR
    trafficCondition: 'Light' | 'Moderate' | 'Heavy';
    roadQuality: 'Good' | 'Fair' | 'Poor';
    totalCost: number;            // toll + fuel combined
    recommended: boolean;
}

export interface AdvancedRouteResult {
    options: AdvancedRouteOption[];
    recommendation: string;       // Hinglish recommendation
}

// ── Mock: Road quality data for known corridors ──
const ROAD_QUALITY: Record<string, 'Good' | 'Fair' | 'Poor'> = {
    'mumbai-pune': 'Good',        // Expressway
    'pune-mumbai': 'Good',
    'delhi-jaipur': 'Good',       // NH48
    'mumbai-nashik': 'Fair',      // Mixed highway + ghats
    'nashik-mumbai': 'Fair',
    'mumbai-goa': 'Fair',         // Coastal + ghats
    'kolkata-delhi': 'Fair',      // Very long, mixed quality
    'delhi-lucknow': 'Good',      // Expressway
    'bangalore-chennai': 'Good',  // NH44
};

// ── Helper: Haversine for advanced route ──
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
}

// ── Helper: Traffic heuristic based on time of day ──
function getTrafficCondition(hour: number): 'Light' | 'Moderate' | 'Heavy' {
    if ((hour >= 8 && hour <= 11) || (hour >= 17 && hour <= 21)) return 'Heavy';
    if ((hour >= 6 && hour < 8) || (hour >= 14 && hour < 17)) return 'Moderate';
    return 'Light';
}

/**
 * Advanced route optimizer — returns 3 route options.
 *
 * Uses time-based traffic heuristics, corridor road quality data,
 * and cost breakdowns to generate Fastest/Cheapest/Balanced options.
 *
 * Fallback: delegates to basic optimizeRoute() if advanced logic fails.
 */
export async function optimizeRouteAdvanced(
    origin: RoutePoint,
    destination: RoutePoint
): Promise<AdvancedRouteResult> {
    try {
        const baseDistanceKm = haversine(origin.lat, origin.lng, destination.lat, destination.lng);
        const hour = new Date().getHours();
        const traffic = getTrafficCondition(hour);

        // Road quality lookup
        const corridorKey = `${origin.name.toLowerCase()}-${destination.name.toLowerCase()}`;
        const roadQuality = ROAD_QUALITY[corridorKey] ?? 'Fair';

        // Traffic speed adjustments
        const trafficSpeeds = { 'Light': 55, 'Moderate': 40, 'Heavy': 30 };
        const avgSpeed = trafficSpeeds[traffic];

        // ── Option 1: Fastest Route (highway, higher toll) ──
        const fastestDist = Math.round(baseDistanceKm * 1.05); // slightly longer highway route
        const fastestTime = Math.round((fastestDist / (avgSpeed * 1.3)) * 60); // 30% faster on highway
        const fastestToll = Math.round(fastestDist * 2.2); // higher toll rate
        const fastestFuel = Math.round((fastestDist / 4) * 102);

        // ── Option 2: Cheapest Route (local roads, no toll) ──
        const cheapestDist = Math.round(baseDistanceKm * 1.2); // 20% longer via local roads
        const cheapestTime = Math.round((cheapestDist / (avgSpeed * 0.7)) * 60); // slower on local roads
        const cheapestToll = 0; // no toll roads
        const cheapestFuel = Math.round((cheapestDist / 3.5) * 102); // worse mileage on local roads

        // ── Option 3: Balanced Route (mix of highway + local) ──
        const balancedDist = Math.round(baseDistanceKm * 1.1);
        const balancedTime = Math.round((balancedDist / avgSpeed) * 60);
        const balancedToll = Math.round(balancedDist * 1.2);
        const balancedFuel = Math.round((balancedDist / 4) * 102);

        const options: AdvancedRouteOption[] = [
            {
                label: 'Fastest',
                route: [origin, destination],
                distanceKm: fastestDist,
                estimatedTimeMinutes: fastestTime,
                tollEstimate: fastestToll,
                fuelEstimate: fastestFuel,
                trafficCondition: traffic,
                roadQuality: 'Good', // highway assumed good
                totalCost: fastestToll + fastestFuel,
                recommended: traffic === 'Heavy', // recommend fastest when traffic is bad
            },
            {
                label: 'Cheapest',
                route: [origin, destination],
                distanceKm: cheapestDist,
                estimatedTimeMinutes: cheapestTime,
                tollEstimate: cheapestToll,
                fuelEstimate: cheapestFuel,
                trafficCondition: traffic === 'Heavy' ? 'Moderate' : 'Light', // local roads less traffic
                roadQuality: roadQuality === 'Good' ? 'Fair' : 'Poor', // local roads worse quality
                totalCost: cheapestToll + cheapestFuel,
                recommended: traffic === 'Light', // recommend cheapest when traffic is low
            },
            {
                label: 'Balanced',
                route: [origin, destination],
                distanceKm: balancedDist,
                estimatedTimeMinutes: balancedTime,
                tollEstimate: balancedToll,
                fuelEstimate: balancedFuel,
                trafficCondition: traffic,
                roadQuality,
                totalCost: balancedToll + balancedFuel,
                recommended: traffic === 'Moderate', // recommend balanced normally
            },
        ];

        // Ensure exactly one is recommended
        const hasRecommended = options.some(o => o.recommended);
        if (!hasRecommended) options[2].recommended = true; // default: balanced

        const recommended = options.find(o => o.recommended)!;
        const recommendation = `🗺️ Best option: ${recommended.label} route — ` +
            `${recommended.distanceKm} km, ~${Math.round(recommended.estimatedTimeMinutes / 60)}h ${recommended.estimatedTimeMinutes % 60}m, ` +
            `₹${recommended.totalCost} total cost. Traffic: ${recommended.trafficCondition}. Road: ${recommended.roadQuality}.`;

        logger.info('Advanced route optimization completed', {
            origin: origin.name,
            destination: destination.name,
            recommended: recommended.label,
            traffic,
        });

        return { options, recommendation };
    } catch (error: any) {
        logger.error('Advanced route optimization failed, using basic fallback', { error: error.message });
        // Fallback to basic route
        const basic = await optimizeRoute(origin, destination);
        return {
            options: [{
                label: 'Balanced',
                route: basic.route,
                distanceKm: parseInt(basic.totalDistance),
                estimatedTimeMinutes: Math.round(parseInt(basic.totalDistance) / 45 * 60),
                tollEstimate: basic.tollCost,
                fuelEstimate: parseInt(basic.fuelEstimate) * 102,
                trafficCondition: 'Moderate',
                roadQuality: 'Fair',
                totalCost: basic.tollCost + parseInt(basic.fuelEstimate) * 102,
                recommended: true,
            }],
            recommendation: `🗺️ Route: ${basic.totalDistance}, Toll: ₹${basic.tollCost}, Fuel: ${basic.fuelEstimate}`,
        };
    }
}
