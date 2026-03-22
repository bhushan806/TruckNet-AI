// ── AI Module: Risk Heatmap Generator ──
// Aggregates risk data into visual format for frontend map overlays.
// Produces GREEN/YELLOW/RED zones with lat/lng centers.
// Called by monitoring.service.ts on every cycle.

import { logger } from '../utils/logger';
import { getRegionDefinitions } from './networkIntelligence.service';
import type {
    HeatmapData,
    HeatmapZone,
    NetworkRegionStatus
} from './types/predictive.types';

// ── In-memory cache for latest heatmap ──
let cachedHeatmap: HeatmapData | null = null;

/**
 * Generates a heatmap from network intelligence region statuses.
 *
 * Risk to Color Mapping:
 *   0-30% → GREEN
 *   31-60% → YELLOW
 *   61-100% → RED
 *
 * Updates the in-memory cache for fast reads.
 */
export async function generateHeatmap(
    regionStatuses: NetworkRegionStatus[]
): Promise<HeatmapData> {
    try {
        const regions = getRegionDefinitions();
        const now = new Date().toISOString();

        const zones: HeatmapZone[] = regions.map(region => {
            // Find status for this region, or default to LOW
            const status = regionStatuses.find(rs => rs.regionId === region.regionId);

            let riskScore = 0;
            let riskLevel: HeatmapZone['riskLevel'] = 'GREEN';
            let affectedShipments = 0;
            let primaryCause = 'No issues detected';
            let recommendations: string[] = ['Normal operations'];

            if (status) {
                affectedShipments = status.activeShipments;
                const highRiskRatio = status.activeShipments > 0
                    ? (status.highRiskShipments / status.activeShipments)
                    : 0;

                // Calculate risk score from ratio + absolute count
                riskScore = Math.min(100, Math.round(
                    highRiskRatio * 70 +
                    Math.min(30, status.highRiskShipments * 10)
                ));

                if (riskScore >= 61) {
                    riskLevel = 'RED';
                    primaryCause = status.primaryFactors.join(', ') || 'Multiple risk factors';
                    recommendations = [
                        'Consider rerouting shipments through this zone',
                        'Alert all drivers in the area',
                        'Monitor traffic and weather continuously',
                    ];
                } else if (riskScore >= 31) {
                    riskLevel = 'YELLOW';
                    primaryCause = status.primaryFactors[0] || 'Moderate risk factors';
                    recommendations = [
                        'Proceed with caution in this area',
                        'Monitor conditions for changes',
                    ];
                } else {
                    riskLevel = 'GREEN';
                    primaryCause = 'No significant issues';
                    recommendations = ['Normal operations — safe to proceed'];
                }
            }

            return {
                zoneId: region.regionId,
                zoneName: region.regionName,
                center: region.center,
                radius: region.radiusKm * 1000, // convert km to meters for frontend
                riskLevel,
                riskScore,
                affectedShipments,
                primaryCause,
                recommendations,
            };
        });

        const heatmap: HeatmapData = { timestamp: now, zones };

        // Update cache
        cachedHeatmap = heatmap;

        logger.info('Heatmap generated', {
            totalZones: zones.length,
            redZones: zones.filter(z => z.riskLevel === 'RED').length,
            yellowZones: zones.filter(z => z.riskLevel === 'YELLOW').length,
        });

        return heatmap;
    } catch (error: any) {
        logger.error('Heatmap generation failed', { error: error.message });
        // Return cached data if available, or empty
        return cachedHeatmap || { timestamp: new Date().toISOString(), zones: [] };
    }
}

/**
 * Returns the latest cached heatmap data.
 * Fast read for API endpoints — no computation needed.
 */
export function getCachedHeatmap(): HeatmapData {
    return cachedHeatmap || { timestamp: new Date().toISOString(), zones: [] };
}
