// ── AI Module: Network Intelligence Engine ──
// Analyzes multiple active shipments to detect regional risk patterns.
// Groups shipments by predefined geographic regions.
// Called periodically by monitoring.service.ts.

import { logger } from '../utils/logger';
import type {
    RegionDefinition,
    NetworkRegionStatus,
    RiskPredictionResult
} from './types/predictive.types';

// ── Predefined Indian Regions ──
const REGIONS: RegionDefinition[] = [
    {
        regionId: 'DEL-NCR',
        regionName: 'Delhi NCR',
        center: { lat: 28.6139, lng: 77.2090 },
        radiusKm: 80,
        cities: ['delhi', 'noida', 'gurgaon', 'gurugram', 'faridabad', 'ghaziabad'],
    },
    {
        regionId: 'MUM-PUN',
        regionName: 'Mumbai-Pune Corridor',
        center: { lat: 18.9647, lng: 73.3230 },
        radiusKm: 100,
        cities: ['mumbai', 'pune', 'navi mumbai', 'thane', 'lonavala'],
    },
    {
        regionId: 'BLR-MYS',
        regionName: 'Bangalore-Mysore',
        center: { lat: 12.5500, lng: 76.8000 },
        radiusKm: 75,
        cities: ['bangalore', 'bengaluru', 'mysore', 'mysuru', 'mandya'],
    },
    {
        regionId: 'CHN',
        regionName: 'Chennai',
        center: { lat: 13.0827, lng: 80.2707 },
        radiusKm: 60,
        cities: ['chennai', 'kanchipuram', 'chengalpattu'],
    },
    {
        regionId: 'KOL',
        regionName: 'Kolkata',
        center: { lat: 22.5726, lng: 88.3639 },
        radiusKm: 50,
        cities: ['kolkata', 'howrah', 'salt lake'],
    },
    {
        regionId: 'AHM',
        regionName: 'Ahmedabad',
        center: { lat: 23.0225, lng: 72.5714 },
        radiusKm: 50,
        cities: ['ahmedabad', 'gandhinagar', 'sanand'],
    },
];

// ── Helper: Haversine distance ──
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

// ── Helper: Match shipment to region ──
function matchRegion(lat: number, lng: number, originCity?: string): RegionDefinition | null {
    // First try city name match
    if (originCity) {
        const cityLower = originCity.toLowerCase();
        const match = REGIONS.find(r => r.cities.some(c => cityLower.includes(c)));
        if (match) return match;
    }

    // Fall back to geographic proximity
    for (const region of REGIONS) {
        const dist = haversineKm(lat, lng, region.center.lat, region.center.lng);
        if (dist <= region.radiusKm) return region;
    }
    return null;
}

/**
 * Analyzes active shipment risk predictions to detect regional patterns.
 *
 * Groups shipments by region, counts HIGH/CRITICAL risk ones.
 * If highRiskCount >= 3 → marks region as "HIGH RISK ZONE".
 *
 * @param predictions Array of risk predictions from the current monitoring cycle.
 * @param shipmentMeta Additional metadata for each shipment (lat/lng, city).
 */
export async function analyzeNetworkPatterns(
    predictions: RiskPredictionResult[],
    shipmentMeta: Array<{ shipmentId: string; lat: number; lng: number; city?: string }>
): Promise<NetworkRegionStatus[]> {
    try {
        // Group by region
        const regionMap = new Map<string, {
            region: RegionDefinition;
            total: number;
            highRisk: number;
            factors: Set<string>;
        }>();

        for (const meta of shipmentMeta) {
            const region = matchRegion(meta.lat, meta.lng, meta.city);
            if (!region) continue;

            if (!regionMap.has(region.regionId)) {
                regionMap.set(region.regionId, {
                    region,
                    total: 0,
                    highRisk: 0,
                    factors: new Set(),
                });
            }

            const entry = regionMap.get(region.regionId)!;
            entry.total++;

            // Check if this shipment has high/critical risk
            const prediction = predictions.find(p => p.shipmentId === meta.shipmentId);
            if (prediction && (prediction.riskLevel === 'HIGH' || prediction.riskLevel === 'CRITICAL')) {
                entry.highRisk++;
                prediction.contributingFactors.forEach(f => entry.factors.add(f.factor));
            }
        }

        // Build results
        const results: NetworkRegionStatus[] = [];
        const now = new Date().toISOString();

        for (const [, entry] of regionMap) {
            let riskLevel: NetworkRegionStatus['riskLevel'];
            let recommendation: string;

            if (entry.highRisk >= 3) {
                riskLevel = 'HIGH';
                recommendation = `⚠️ ${entry.region.regionName} is a HIGH RISK ZONE. ` +
                    `${entry.highRisk}/${entry.total} shipments at risk. ` +
                    `Consider rerouting or delaying departures through this region.`;
            } else if (entry.highRisk >= 1) {
                riskLevel = 'MEDIUM';
                recommendation = `Monitor shipments in ${entry.region.regionName}. ` +
                    `${entry.highRisk} shipment(s) showing elevated risk.`;
            } else {
                riskLevel = 'LOW';
                recommendation = `${entry.region.regionName} conditions are normal.`;
            }

            results.push({
                regionId: entry.region.regionId,
                regionName: entry.region.regionName,
                center: entry.region.center,
                riskLevel,
                activeShipments: entry.total,
                highRiskShipments: entry.highRisk,
                primaryFactors: Array.from(entry.factors),
                recommendation,
                timestamp: now,
            });
        }

        logger.info('Network intelligence completed', {
            regionsAnalyzed: results.length,
            highRiskRegions: results.filter(r => r.riskLevel === 'HIGH').length,
        });

        return results;
    } catch (error: any) {
        logger.error('Network intelligence failed', { error: error.message });
        return [];
    }
}

/**
 * Returns the predefined region definitions (for heatmap service).
 */
export function getRegionDefinitions(): RegionDefinition[] {
    return REGIONS;
}
