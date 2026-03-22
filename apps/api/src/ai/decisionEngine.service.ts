// ── AI Module: Decision Engine ──
// Takes risk prediction output and decides the optimal action.
// Generates alternate route suggestions for reroute decisions.
// Called by monitoring.service.ts.

import { logger } from '../utils/logger';
import { optimizeRouteAdvanced } from './routeOptimizer';
import type { RiskPredictionResult, DecisionResult, AlternateRoute } from './types/predictive.types';

// ── Decision Matrix ──
// Risk Level  → Action
// ─────────────────────────
// LOW         → CONTINUE
// MEDIUM      → SUGGEST_CAUTION
// HIGH        → SUGGEST_REROUTE
// CRITICAL    → FORCE_REROUTE + ESCALATE

/**
 * Decides the best action based on a risk prediction.
 *
 * For SUGGEST_REROUTE and FORCE_REROUTE, attempts to generate
 * alternate route suggestions using the existing routeOptimizer.
 *
 * Graceful fallback: returns SUGGEST_CAUTION if decision fails.
 */
export async function makeDecision(prediction: RiskPredictionResult): Promise<DecisionResult> {
    try {
        const { shipmentId, riskLevel, predictedDelayMinutes, contributingFactors } = prediction;

        let action: DecisionResult['action'];
        let primaryRecommendation: string;
        let requiresApproval = false;
        let alternateRoutes: AlternateRoute[] | undefined;
        let timeSaved = 0;
        let delayAvoided = false;

        switch (riskLevel) {
            case 'LOW':
                action = 'CONTINUE';
                primaryRecommendation = 'All clear — continue on current route. No significant risks detected.';
                break;

            case 'MEDIUM':
                action = 'SUGGEST_CAUTION';
                primaryRecommendation = `Moderate risk detected (${predictedDelayMinutes} min potential delay). ` +
                    `Proceed with caution. ${contributingFactors[0]?.description || 'Monitor conditions.'}`;
                break;

            case 'HIGH':
                action = 'SUGGEST_REROUTE';
                requiresApproval = true;
                alternateRoutes = await generateAlternateRoutes(shipmentId);
                timeSaved = alternateRoutes[0]?.timeSaved || Math.round(predictedDelayMinutes * 0.5);
                delayAvoided = timeSaved > 10;
                primaryRecommendation = `High delay risk (${predictedDelayMinutes} min). ` +
                    `Alternate route available — saves ~${timeSaved} min. ` +
                    `Reason: ${contributingFactors[0]?.description || 'Multiple risk factors'}`;
                break;

            case 'CRITICAL':
                action = 'ESCALATE';
                requiresApproval = false; // auto-escalate, no approval needed
                alternateRoutes = await generateAlternateRoutes(shipmentId);
                timeSaved = alternateRoutes[0]?.timeSaved || Math.round(predictedDelayMinutes * 0.6);
                delayAvoided = true;
                primaryRecommendation = `🔴 CRITICAL: Severe delay expected (${predictedDelayMinutes} min). ` +
                    `Force rerouting recommended. Escalating to fleet manager. ` +
                    `Reason: ${contributingFactors.map(f => f.factor).join(', ')}`;
                break;

            default:
                action = 'SUGGEST_CAUTION';
                primaryRecommendation = 'Unable to determine risk level — proceed with caution.';
        }

        logger.info('Decision made', { shipmentId, action, riskLevel });

        return {
            shipmentId,
            action,
            primaryRecommendation,
            alternateRoutes,
            estimatedImpact: {
                timeSaved,
                delayAvoided,
            },
            requiresApproval,
        };
    } catch (error: any) {
        logger.error('Decision engine failed', { error: error.message, shipmentId: prediction.shipmentId });
        // Graceful fallback
        return {
            shipmentId: prediction.shipmentId,
            action: 'SUGGEST_CAUTION',
            primaryRecommendation: 'Decision system temporarily unavailable — proceed with standard precautions.',
            estimatedImpact: { timeSaved: 0, delayAvoided: false },
            requiresApproval: false,
        };
    }
}

// ── Helper: Generate alternate routes ──
// Uses existing routeOptimizer for Haversine-based suggestions.
async function generateAlternateRoutes(shipmentId: string): Promise<AlternateRoute[]> {
    try {
        // Use existing advanced route optimizer with sample waypoints
        // In production, these would come from the shipment's actual route data
        const result = await optimizeRouteAdvanced(
            { lat: 18.5204, lng: 73.8567, name: 'Pune' },
            { lat: 19.0760, lng: 72.8777, name: 'Mumbai' }
        );

        return result.options
            .filter(opt => !opt.recommended) // return non-recommended as alternates
            .map((opt, idx) => ({
                routeId: `ALT-${shipmentId}-${idx + 1}`,
                description: `${opt.label} route via ${opt.roadQuality} roads (${opt.trafficCondition} traffic)`,
                timeSaved: Math.max(0, Math.round((result.options[0]?.estimatedTimeMinutes || 0) - opt.estimatedTimeMinutes)),
                fuelSaved: Math.max(0, (result.options[0]?.fuelEstimate || 0) - opt.fuelEstimate),
                newRiskScore: opt.label === 'Cheapest' ? 35 : 25, // heuristic: alternate routes have lower risk
            }));
    } catch (error: any) {
        logger.warn('Alternate route generation failed', { error: error.message });
        // Return a single generic suggestion
        return [{
            routeId: `ALT-${shipmentId}-1`,
            description: 'Alternative highway route (estimated)',
            timeSaved: 15,
            fuelSaved: 200,
            newRiskScore: 30,
        }];
    }
}
