// ── AI Module: Risk Prediction Engine ──
// Predicts delay probability and risk level for any shipment.
// Wraps existing risk.engine.ts and adds shipment-specific factors.
// Called by monitoring.service.ts and dost.service.ts.

import { logger } from '../utils/logger';
import type {
    RiskPredictionInput,
    RiskPredictionResult,
    ContributingFactor
} from './types/predictive.types';

// ── Congested corridors (dummy data — extend as needed) ──
const CONGESTED_CORRIDORS = [
    'nh-48', 'mumbai-pune', 'pune-mumbai',
    'nh-44', 'delhi-agra', 'agra-delhi',
    'nh-8', 'mumbai-ahmedabad', 'ahmedabad-mumbai',
    'bangalore-mysore', 'mysore-bangalore',
    'chennai-bangalore', 'bangalore-chennai',
];

// ── Helper: Haversine distance in km ──
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lng2 - lng1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Helper: Check if current hour is peak ──
function isPeakHour(hour: number): boolean {
    return (hour >= 7 && hour <= 10) || (hour >= 17 && hour <= 20);
}

// ── Main Function ──

/**
 * Predicts shipment delay probability and risk level.
 *
 * Factors:
 * - Peak hours (+30%)
 * - Congested corridor (+20%)
 * - Weather: rain/fog (+20%)
 * - Distance > 500km fatigue (+15%)
 * - Traffic data: heavy (+15%), moderate (+8%)
 * - Low driver rating (+10%)
 *
 * Graceful fallback: returns MEDIUM risk if assessment fails.
 */
export async function predictShipmentRisk(input: RiskPredictionInput): Promise<RiskPredictionResult> {
    try {
        let riskScore = 0;
        const factors: ContributingFactor[] = [];
        const now = new Date();
        const hour = now.getHours();

        // ── 1. Peak Hours (+30%) ──
        const peakMode = input.timeOfDay === 'peak' || (input.timeOfDay === undefined && isPeakHour(hour));
        if (peakMode) {
            riskScore += 30;
            factors.push({
                factor: 'Peak Hours',
                impact: 30,
                description: `Current time falls in peak traffic window (7-10 AM or 5-8 PM)`
            });
        }

        // ── 2. Congested Corridor (+20%) ──
        const origin = (input.originCity || '').toLowerCase();
        const dest = (input.destinationCity || '').toLowerCase();
        const corridorKey = `${origin}-${dest}`;
        const isCongestedCorridor = CONGESTED_CORRIDORS.some(c =>
            corridorKey.includes(c) || c.includes(corridorKey)
        );
        if (isCongestedCorridor) {
            riskScore += 20;
            factors.push({
                factor: 'Congested Corridor',
                impact: 20,
                description: `Route ${input.originCity} → ${input.destinationCity} is a known congestion hotspot`
            });
        }

        // ── 3. Weather (+20%) ──
        if (input.weatherData === 'rain' || input.weatherData === 'fog') {
            riskScore += 20;
            factors.push({
                factor: 'Adverse Weather',
                impact: 20,
                description: `${input.weatherData === 'rain' ? 'Rainfall' : 'Dense fog'} reported along route`
            });
        } else if (input.weatherData === 'storm') {
            riskScore += 30;
            factors.push({
                factor: 'Severe Weather',
                impact: 30,
                description: 'Storm warning active along the route'
            });
        }

        // ── 4. Distance & Fatigue (+15%) ──
        let totalDistanceKm = 0;
        if (input.plannedRoute.length >= 2) {
            for (let i = 0; i < input.plannedRoute.length - 1; i++) {
                totalDistanceKm += haversineKm(
                    input.plannedRoute[i].lat, input.plannedRoute[i].lng,
                    input.plannedRoute[i + 1].lat, input.plannedRoute[i + 1].lng
                );
            }
        }
        if (totalDistanceKm > 500) {
            riskScore += 15;
            factors.push({
                factor: 'Long Distance Fatigue',
                impact: 15,
                description: `Route distance (${Math.round(totalDistanceKm)}km) exceeds 500km — driver fatigue factor`
            });
        }

        // ── 5. Traffic Data ──
        if (input.trafficData === 'heavy') {
            riskScore += 15;
            factors.push({
                factor: 'Heavy Traffic',
                impact: 15,
                description: 'Live traffic data shows heavy congestion along route segments'
            });
        } else if (input.trafficData === 'moderate') {
            riskScore += 8;
            factors.push({
                factor: 'Moderate Traffic',
                impact: 8,
                description: 'Moderate traffic reported on key route segments'
            });
        }

        // ── 6. Driver Rating ──
        if (input.driverRating !== undefined && input.driverRating < 3.5) {
            riskScore += 10;
            factors.push({
                factor: 'Low Driver Rating',
                impact: 10,
                description: `Driver rating (${input.driverRating}/5) below threshold — higher incident probability`
            });
        }

        // Clamp to 0-100
        riskScore = Math.max(0, Math.min(100, riskScore));

        // ── Risk Level Mapping ──
        let riskLevel: RiskPredictionResult['riskLevel'];
        if (riskScore >= 86) riskLevel = 'CRITICAL';
        else if (riskScore >= 61) riskLevel = 'HIGH';
        else if (riskScore >= 31) riskLevel = 'MEDIUM';
        else riskLevel = 'LOW';

        // ── Predicted Delay (heuristic) ──
        const predictedDelayMinutes = riskLevel === 'CRITICAL'
            ? Math.round(totalDistanceKm * 0.2)
            : riskLevel === 'HIGH'
                ? Math.round(totalDistanceKm * 0.12)
                : riskLevel === 'MEDIUM'
                    ? Math.round(totalDistanceKm * 0.06)
                    : Math.round(totalDistanceKm * 0.02);

        // Confidence based on data completeness
        let confidence = 0.6; // base confidence
        if (input.weatherData) confidence += 0.1;
        if (input.trafficData) confidence += 0.1;
        if (input.driverRating !== undefined) confidence += 0.1;
        if (input.originCity && input.destinationCity) confidence += 0.1;
        confidence = Math.min(1, confidence);

        logger.info('Risk prediction completed', {
            shipmentId: input.shipmentId,
            riskLevel,
            riskScore,
            factorCount: factors.length,
        });

        return {
            shipmentId: input.shipmentId,
            delayProbability: riskScore,
            riskLevel,
            predictedDelayMinutes: Math.max(0, predictedDelayMinutes),
            contributingFactors: factors,
            timestamp: now.toISOString(),
            confidence: Math.round(confidence * 100) / 100,
        };
    } catch (error: any) {
        logger.error('Risk prediction failed', { error: error.message, shipmentId: input.shipmentId });
        // Graceful fallback
        return {
            shipmentId: input.shipmentId,
            delayProbability: 40,
            riskLevel: 'MEDIUM',
            predictedDelayMinutes: 30,
            contributingFactors: [{
                factor: 'System Unavailable',
                impact: 0,
                description: 'Risk assessment temporarily unavailable — defaulting to MEDIUM'
            }],
            timestamp: new Date().toISOString(),
            confidence: 0.3,
        };
    }
}
