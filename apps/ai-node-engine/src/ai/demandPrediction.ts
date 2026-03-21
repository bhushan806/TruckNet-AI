// ── AI Module: Demand Prediction ──
// Predicts load demand based on historical data, seasonal patterns,
// and regional factors. Called only via services layer.

import { logger } from '../utils/logger';

export interface DemandContext {
    region: string;
    vehicleType: string;
    dayOfWeek?: number;
    month?: number;
    historicalLoadCount?: number;
}

export interface DemandPrediction {
    predictedDemand: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
    confidence: number;
    suggestedPriceMultiplier: number;
    reasoning: string;
}

/**
 * Predicts logistics demand for a given region and vehicle type.
 *
 * Uses seasonal heuristics and regional demand patterns.
 * In production, this would be backed by ML model trained on historical data.
 */
export async function predictDemand(context: DemandContext): Promise<DemandPrediction> {
    try {
        const now = new Date();
        const month = context.month ?? now.getMonth() + 1;
        const dayOfWeek = context.dayOfWeek ?? now.getDay();

        // Seasonal demand factors (Indian logistics patterns)
        // Peak: Oct-Dec (festivals), Jan-Mar (harvest season)
        // Low: Jul-Aug (monsoon disruptions)
        let seasonalFactor = 1.0;
        if ([10, 11, 12].includes(month)) seasonalFactor = 1.4; // Diwali/festive
        else if ([1, 2, 3].includes(month)) seasonalFactor = 1.2; // Post-harvest
        else if ([7, 8].includes(month)) seasonalFactor = 0.7; // Monsoon
        else seasonalFactor = 1.0;

        // Weekend factor (lower demand on Sundays)
        const weekendFactor = dayOfWeek === 0 ? 0.8 : dayOfWeek === 6 ? 0.9 : 1.0;

        // Regional factor (metro vs. rural)
        const regionalDemand: Record<string, number> = {
            mumbai: 1.5, delhi: 1.4, pune: 1.3, bangalore: 1.3,
            chennai: 1.2, hyderabad: 1.2, kolkata: 1.1,
        };
        const regionFactor = regionalDemand[context.region.toLowerCase()] ?? 1.0;

        // Composite score
        const score = seasonalFactor * weekendFactor * regionFactor;

        let demand: DemandPrediction['predictedDemand'];
        let multiplier: number;

        if (score >= 1.5) { demand = 'VERY_HIGH'; multiplier = 1.6; }
        else if (score >= 1.2) { demand = 'HIGH'; multiplier = 1.3; }
        else if (score >= 0.9) { demand = 'MODERATE'; multiplier = 1.0; }
        else { demand = 'LOW'; multiplier = 0.85; }

        const confidence = Math.min(0.95, 0.6 + (context.historicalLoadCount ?? 0) * 0.005);

        return {
            predictedDemand: demand,
            confidence: Math.round(confidence * 100) / 100,
            suggestedPriceMultiplier: multiplier,
            reasoning: `Based on ${context.region} regional demand (${regionFactor}x), seasonal pattern (${seasonalFactor}x), and day-of-week adjustment (${weekendFactor}x).`,
        };
    } catch (error: any) {
        logger.error('Demand prediction failed', { error: error.message, context });
        throw error;
    }
}
