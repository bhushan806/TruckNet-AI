// ── AI Module: Risk & Delay Prediction Engine ──
// Predicts potential delivery issues based on route, weather, driver, and history.
// Uses weighted rule-based scoring with seasonal heuristics.
// Called only via services layer, NEVER directly from routes.

import { logger } from '../utils/logger';

// ── Interfaces ──

export interface RiskInput {
    originLat: number;
    originLng: number;
    destinationLat: number;
    destinationLng: number;
    originCity?: string;
    destinationCity?: string;
    distanceKm?: number;
    driverRating?: number;           // 1-5
    driverTotalTrips?: number;
    historicalDelayRate?: number;     // 0-1 (percentage of delayed trips)
    month?: number;                  // 1-12
    hourOfDay?: number;              // 0-23
    goodsType?: string;              // e.g., "Perishable", "Electronics"
}

export interface RiskResult {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    riskScore: number;               // 0-100
    reasons: string[];
    recommendations: string[];
    delayProbability: number;        // 0-1
    estimatedDelayMinutes: number;
}

// ── Static Data ──

// Monsoon-affected regions and months
const MONSOON_REGIONS = ['mumbai', 'pune', 'goa', 'kolkata', 'chennai', 'kochi', 'mangalore'];
const MONSOON_MONTHS = [6, 7, 8, 9]; // June to September

// High-risk corridors (known for delays)
const HIGH_RISK_CORRIDORS: Record<string, number> = {
    'mumbai-pune': 15,        // Ghats, frequent accidents
    'pune-mumbai': 15,
    'delhi-jaipur': 10,       // Highway construction
    'kolkata-delhi': 20,      // Very long, multiple states
    'delhi-kolkata': 20,
    'mumbai-goa': 12,         // Ghats + single lane stretches
    'goa-mumbai': 12,
};

// Goods type risk factors
const GOODS_RISK: Record<string, number> = {
    'perishable': 15,
    'electronics': 10,
    'fragile': 12,
    'hazardous': 20,
    'general': 0,
    'construction': 5,
};

// ── Helper: Haversine Distance ──

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

// ── Main Function ──

/**
 * Predicts delivery risk and potential delays.
 *
 * Factors: distance, weather (seasonal), driver reliability, corridor risk,
 * goods fragility, time-of-day, historical delays.
 *
 * Returns risk level, reasons, and actionable recommendations.
 * Fallback: Returns MEDIUM risk if assessment fails.
 */
export async function assessDeliveryRisk(input: RiskInput): Promise<RiskResult> {
    try {
        let riskScore = 0;
        const reasons: string[] = [];
        const recommendations: string[] = [];
        const now = new Date();

        const month = input.month ?? (now.getMonth() + 1);
        const hour = input.hourOfDay ?? now.getHours();

        // Calculate distance if not provided
        const distanceKm = input.distanceKm ??
            haversineKm(input.originLat, input.originLng, input.destinationLat, input.destinationLng);

        // ── 1. Distance Risk (longer = higher risk) ──
        if (distanceKm > 1000) {
            riskScore += 20;
            reasons.push('Very long distance (>1000 km) — higher delay probability');
            recommendations.push('Plan for overnight halts and driver rotation');
        } else if (distanceKm > 500) {
            riskScore += 10;
            reasons.push('Long distance route (>500 km)');
        } else if (distanceKm > 200) {
            riskScore += 5;
        }

        // ── 2. Weather / Seasonal Risk ──
        const originCity = (input.originCity || '').toLowerCase();
        const destCity = (input.destinationCity || '').toLowerCase();

        if (MONSOON_MONTHS.includes(month)) {
            const affectedOrigin = MONSOON_REGIONS.includes(originCity);
            const affectedDest = MONSOON_REGIONS.includes(destCity);

            if (affectedOrigin && affectedDest) {
                riskScore += 25;
                reasons.push('Monsoon season — both origin & destination in heavy rain zone');
                recommendations.push('Carry waterproof covers. Check road conditions before departure');
            } else if (affectedOrigin || affectedDest) {
                riskScore += 15;
                reasons.push('Monsoon season — route passes through rain-prone region');
                recommendations.push('Monitor weather updates along the route');
            }
        }

        // Winter fog risk (North India, Dec-Jan)
        const northCities = ['delhi', 'lucknow', 'jaipur', 'chandigarh', 'amritsar'];
        if ([12, 1].includes(month) && (northCities.includes(originCity) || northCities.includes(destCity))) {
            riskScore += 12;
            reasons.push('Winter fog risk on North Indian highways');
            recommendations.push('Avoid night driving. Use fog lights');
        }

        // ── 3. Driver Reliability ──
        if (input.driverRating !== undefined) {
            if (input.driverRating < 3.0) {
                riskScore += 20;
                reasons.push(`Driver rating below average (${input.driverRating}/5)`);
                recommendations.push('Consider assigning a higher-rated driver');
            } else if (input.driverRating < 3.5) {
                riskScore += 10;
                reasons.push(`Driver rating moderate (${input.driverRating}/5)`);
            }
            // Good drivers reduce risk
            if (input.driverRating >= 4.5 && (input.driverTotalTrips ?? 0) > 100) {
                riskScore -= 5;
            }
        }

        // New driver risk
        if (input.driverTotalTrips !== undefined && input.driverTotalTrips < 10) {
            riskScore += 10;
            reasons.push('New driver with limited trip history');
            recommendations.push('Assign experienced co-driver if possible');
        }

        // ── 4. Historical Delay Pattern ──
        if (input.historicalDelayRate !== undefined && input.historicalDelayRate > 0.3) {
            riskScore += Math.round(input.historicalDelayRate * 20);
            reasons.push(`Historical delay rate: ${Math.round(input.historicalDelayRate * 100)}% of past trips delayed`);
        }

        // ── 5. Corridor Risk ──
        const corridorKey = `${originCity}-${destCity}`;
        const corridorRisk = HIGH_RISK_CORRIDORS[corridorKey] ?? 0;
        if (corridorRisk > 0) {
            riskScore += corridorRisk;
            reasons.push(`Known high-risk corridor: ${input.originCity} ↔ ${input.destinationCity}`);
        }

        // ── 6. Goods Type Risk ──
        const goodsKey = (input.goodsType || 'general').toLowerCase();
        const goodsRisk = GOODS_RISK[goodsKey] ?? 0;
        if (goodsRisk > 0) {
            riskScore += goodsRisk;
            reasons.push(`${input.goodsType} goods require extra care during transport`);
            if (goodsKey === 'perishable') {
                recommendations.push('Ensure refrigeration is working. Minimize halt time');
            }
        }

        // ── 7. Time-of-Day Risk ──
        if (hour >= 22 || hour < 5) {
            riskScore += 8;
            reasons.push('Night driving increases accident risk');
            recommendations.push('Ensure well-rested driver for night journey');
        }

        // Clamp score to 0-100
        riskScore = Math.max(0, Math.min(100, riskScore));

        // Determine risk level
        let riskLevel: RiskResult['riskLevel'];
        if (riskScore >= 50) riskLevel = 'HIGH';
        else if (riskScore >= 25) riskLevel = 'MEDIUM';
        else riskLevel = 'LOW';

        // Delay probability and estimated delay
        const delayProbability = Math.min(0.95, riskScore / 100);
        const estimatedDelayMinutes = riskLevel === 'HIGH'
            ? Math.round(distanceKm * 0.15)   // ~15% of travel time
            : riskLevel === 'MEDIUM'
                ? Math.round(distanceKm * 0.08) // ~8% of travel time
                : Math.round(distanceKm * 0.03); // ~3% of travel time

        // If no reasons were generated, add a positive note
        if (reasons.length === 0) {
            reasons.push('No significant risk factors detected');
            recommendations.push('Safe journey expected — standard precautions apply');
        }

        logger.info('Risk assessment completed', {
            origin: input.originCity,
            destination: input.destinationCity,
            riskLevel,
            riskScore,
        });

        return {
            riskLevel,
            riskScore,
            reasons,
            recommendations,
            delayProbability: Math.round(delayProbability * 100) / 100,
            estimatedDelayMinutes,
        };
    } catch (error: any) {
        logger.error('Risk assessment failed', { error: error.message });
        // Fail-safe: assume medium risk rather than hiding potential issues
        return {
            riskLevel: 'MEDIUM',
            riskScore: 40,
            reasons: ['Risk assessment system temporarily unavailable — manual review recommended'],
            recommendations: ['Proceed with standard safety precautions'],
            delayProbability: 0.3,
            estimatedDelayMinutes: 30,
        };
    }
}
