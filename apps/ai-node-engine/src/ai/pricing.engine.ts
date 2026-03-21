// ── AI Module: Smart Dynamic Pricing Engine ──
// Predicts fair price based on distance, demand, availability, and fuel.
// Uses demand prediction module for surge factor.
// Called only via services layer, NEVER directly from routes.

import { logger } from '../utils/logger';
import { predictDemand } from './demandPrediction';

// ── Interfaces ──

export interface PricingInput {
    distanceKm: number;
    originRegion: string;      // city name (e.g., "Mumbai")
    destinationRegion: string; // city name
    vehicleType: string;       // e.g., "Truck", "Mini Truck"
    weight: number;            // in tonnes
    truckAvailability?: number; // 0-1 (0 = none available, 1 = plenty)
}

export interface PricingResult {
    minPrice: number;
    maxPrice: number;
    recommendedPrice: number;
    confidence: number;
    breakdown: {
        baseFare: number;
        demandSurgeFactor: number;
        routeDifficultyFactor: number;
        weightFactor: number;
        fuelEstimate: number;
        availabilityDiscount: number;
    };
    reasoning: string;
}

// ── Static Config ──

// Base rate per km by vehicle type (INR)
const BASE_RATES: Record<string, number> = {
    'truck': 18,
    'heavy truck': 22,
    'mini truck': 14,
    'trailer': 25,
    'container': 28,
};

// Route difficulty multipliers (based on terrain between major corridors)
const ROUTE_DIFFICULTY: Record<string, number> = {
    'mumbai-pune': 1.1,       // Ghats
    'pune-mumbai': 1.1,
    'delhi-jaipur': 1.0,      // Highway
    'mumbai-delhi': 1.15,     // Long distance
    'delhi-mumbai': 1.15,
    'bangalore-chennai': 1.05,
    'chennai-bangalore': 1.05,
    'mumbai-nashik': 1.1,     // Ghats
    'nashik-mumbai': 1.1,
    'kolkata-delhi': 1.2,     // Very long
    'delhi-kolkata': 1.2,
};

// Fuel price per liter (INR) — static baseline
const FUEL_PRICE_PER_LITER = 102;

// Average truck mileage (km/L) by type
const MILEAGE: Record<string, number> = {
    'truck': 4,
    'heavy truck': 3,
    'mini truck': 6,
    'trailer': 2.5,
    'container': 3,
};

// ── Main Pricing Function ──

/**
 * Calculates dynamic price range for a logistics trip.
 *
 * Combines: base fare + demand surge + route difficulty + weight + fuel estimate.
 * Returns min-max range with confidence score.
 *
 * Fallback: Returns simple distance×rate estimate if demand prediction fails.
 */
export async function calculateDynamicPrice(input: PricingInput): Promise<PricingResult> {
    try {
        const vehicleKey = input.vehicleType.toLowerCase();
        const baseRate = BASE_RATES[vehicleKey] ?? 18;

        // 1. Base fare
        const baseFare = baseRate * input.distanceKm;

        // 2. Demand surge factor (from existing demand prediction module)
        let demandSurgeFactor = 1.0;
        let demandConfidence = 0.6;
        try {
            const demand = await predictDemand({
                region: input.originRegion,
                vehicleType: input.vehicleType,
            });
            demandSurgeFactor = demand.suggestedPriceMultiplier;
            demandConfidence = demand.confidence;
        } catch (e) {
            logger.warn('Demand prediction unavailable for pricing, using baseline', {
                error: (e as any).message,
            });
            // Keep default surge = 1.0
        }

        // 3. Route difficulty factor
        const routeKey = `${input.originRegion.toLowerCase()}-${input.destinationRegion.toLowerCase()}`;
        const routeDifficultyFactor = ROUTE_DIFFICULTY[routeKey] ?? 1.0;

        // 4. Weight factor (heavier = more expensive)
        let weightFactor = 1.0;
        if (input.weight > 15) weightFactor = 1.3;
        else if (input.weight > 10) weightFactor = 1.2;
        else if (input.weight > 5) weightFactor = 1.1;

        // 5. Fuel estimate
        const mileage = MILEAGE[vehicleKey] ?? 4;
        const fuelLiters = input.distanceKm / mileage;
        const fuelEstimate = Math.round(fuelLiters * FUEL_PRICE_PER_LITER);

        // 6. Availability discount (more trucks available = lower price)
        const availability = input.truckAvailability ?? 0.5;
        const availabilityDiscount = availability > 0.7 ? 0.95 : availability < 0.3 ? 1.1 : 1.0;

        // Composite price
        const recommendedPrice = Math.round(
            baseFare * demandSurgeFactor * routeDifficultyFactor * weightFactor * availabilityDiscount
        );

        // Price range: ±12% for min/max
        const minPrice = Math.round(recommendedPrice * 0.88);
        const maxPrice = Math.round(recommendedPrice * 1.12);

        // Confidence blends demand confidence with route data availability
        const hasRouteData = ROUTE_DIFFICULTY[routeKey] !== undefined;
        const confidence = Math.round(
            (demandConfidence * 0.6 + (hasRouteData ? 0.9 : 0.5) * 0.4) * 100
        ) / 100;

        const reasoning = `Base ₹${baseRate}/km × ${input.distanceKm}km = ₹${baseFare}. ` +
            `Demand surge: ${demandSurgeFactor}x. Route difficulty: ${routeDifficultyFactor}x. ` +
            `Weight factor: ${weightFactor}x. Fuel: ~₹${fuelEstimate}.`;

        logger.info('Dynamic pricing calculated', {
            origin: input.originRegion,
            destination: input.destinationRegion,
            recommendedPrice,
            confidence,
        });

        return {
            minPrice,
            maxPrice,
            recommendedPrice,
            confidence,
            breakdown: {
                baseFare,
                demandSurgeFactor,
                routeDifficultyFactor,
                weightFactor,
                fuelEstimate,
                availabilityDiscount,
            },
            reasoning,
        };
    } catch (error: any) {
        logger.error('Dynamic pricing failed', { error: error.message });
        // Fallback: simple distance-based estimate
        const fallbackPrice = Math.round(input.distanceKm * 18);
        return {
            minPrice: Math.round(fallbackPrice * 0.85),
            maxPrice: Math.round(fallbackPrice * 1.15),
            recommendedPrice: fallbackPrice,
            confidence: 0.3,
            breakdown: {
                baseFare: fallbackPrice,
                demandSurgeFactor: 1,
                routeDifficultyFactor: 1,
                weightFactor: 1,
                fuelEstimate: 0,
                availabilityDiscount: 1,
            },
            reasoning: 'Fallback estimate. AI pricing engine unavailable.',
        };
    }
}
