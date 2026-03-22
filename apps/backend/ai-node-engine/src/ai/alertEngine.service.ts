// ── AI Module: Alert Engine ──
// Generates and stores real-time alerts based on risk predictions and decisions.
// Handles escalation logic for unacknowledged alerts.
// Called by monitoring.service.ts.

import { logger } from '../utils/logger';
import { AlertModel } from '../models/mongoose/Alert';
import type { RiskPredictionResult, DecisionResult, AlertType } from './types/predictive.types';
import { randomUUID } from 'crypto';

/**
 * Creates and stores an alert based on risk prediction and decision engine output.
 *
 * Alert Types:
 * - RISK_HIGH: Risk > 60%
 * - REROUTE_SUGGESTED: Action = SUGGEST_REROUTE
 * - DELAY_CRITICAL: Risk = CRITICAL
 * - NETWORK_CONGESTION: Regional alert (called separately)
 *
 * Returns the created alert document, or null on failure.
 */
export async function createAlert(
    prediction: RiskPredictionResult,
    decision: DecisionResult,
    userId: string
): Promise<any> {
    try {
        let type: AlertType;
        let title: string;
        let message: string;
        let actionRequired = false;

        if (prediction.riskLevel === 'CRITICAL') {
            type = 'DELAY_CRITICAL';
            title = '🔴 Critical Delay Alert';
            message = `Severe delay expected on shipment ${prediction.shipmentId}. ` +
                `Predicted delay: ${prediction.predictedDelayMinutes} min. ` +
                `Immediate action recommended.`;
            actionRequired = true;
        } else if (decision.action === 'SUGGEST_REROUTE' || decision.action === 'FORCE_REROUTE') {
            type = 'REROUTE_SUGGESTED';
            title = '🗺️ Route Change Suggested';
            message = `Alternate route available for shipment ${prediction.shipmentId}. ` +
                `Potential time savings: ${decision.estimatedImpact.timeSaved} min.`;
            actionRequired = true;
        } else {
            type = 'RISK_HIGH';
            title = '⚠️ High Delay Risk Detected';
            message = `High delay risk on shipment ${prediction.shipmentId}. ` +
                `Risk: ${prediction.delayProbability}% | Delay: ~${prediction.predictedDelayMinutes} min. ` +
                `Factors: ${prediction.contributingFactors.map(f => f.factor).join(', ')}`;
            actionRequired = false;
        }

        const alert = await AlertModel.create({
            alertId: `ALR-${randomUUID().slice(0, 8).toUpperCase()}`,
            shipmentId: prediction.shipmentId,
            userId,
            type,
            title,
            message,
            actionRequired,
            suggestedAction: decision.primaryRecommendation,
            read: false,
            acknowledged: false,
            escalated: false,
            escalationCount: 0,
        });

        logger.info('Alert created', {
            alertId: alert.alertId,
            type,
            shipmentId: prediction.shipmentId,
        });

        return alert;
    } catch (error: any) {
        logger.error('Alert creation failed', { error: error.message, shipmentId: prediction.shipmentId });
        return null;
    }
}

/**
 * Creates a network congestion alert for regional risk.
 */
export async function createNetworkAlert(
    regionName: string,
    highRiskCount: number,
    userId: string,
    recommendation: string
): Promise<any> {
    try {
        const alert = await AlertModel.create({
            alertId: `ALR-NET-${randomUUID().slice(0, 8).toUpperCase()}`,
            shipmentId: `REGION-${regionName.replace(/\s+/g, '-').toUpperCase()}`,
            userId,
            type: 'NETWORK_CONGESTION' as AlertType,
            title: '🌐 Regional Congestion Alert',
            message: `${highRiskCount} trucks facing delays in ${regionName}. ${recommendation}`,
            actionRequired: highRiskCount >= 5,
            suggestedAction: recommendation,
            read: false,
            acknowledged: false,
            escalated: false,
            escalationCount: 0,
        });

        logger.info('Network alert created', { alertId: alert.alertId, regionName });
        return alert;
    } catch (error: any) {
        logger.error('Network alert creation failed', { error: error.message, regionName });
        return null;
    }
}

/**
 * Escalation check: finds unacknowledged alerts older than 5 minutes and escalates them.
 * Called periodically by the monitoring service.
 */
export async function escalateUnacknowledgedAlerts(): Promise<number> {
    try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        const staleAlerts = await AlertModel.find({
            acknowledged: false,
            escalated: false,
            actionRequired: true,
            createdAt: { $lte: fiveMinutesAgo },
        });

        let escalatedCount = 0;
        for (const alert of staleAlerts) {
            alert.escalated = true;
            alert.escalationCount = (alert.escalationCount || 0) + 1;
            await alert.save();
            escalatedCount++;

            logger.warn('Alert escalated', {
                alertId: alert.alertId,
                shipmentId: alert.shipmentId,
                escalationCount: alert.escalationCount,
            });
        }

        return escalatedCount;
    } catch (error: any) {
        logger.error('Alert escalation failed', { error: error.message });
        return 0;
    }
}

/**
 * Fetch alerts for a user (paginated, most recent first).
 */
export async function getAlertsByUser(userId: string, limit = 20): Promise<any[]> {
    try {
        return await AlertModel.find({ userId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
    } catch (error: any) {
        logger.error('Fetch alerts failed', { error: error.message, userId });
        return [];
    }
}

/**
 * Acknowledge an alert by alertId.
 */
export async function acknowledgeAlert(alertId: string): Promise<boolean> {
    try {
        const result = await AlertModel.findOneAndUpdate(
            { alertId },
            { acknowledged: true, read: true },
            { new: true }
        );
        return !!result;
    } catch (error: any) {
        logger.error('Alert acknowledge failed', { error: error.message, alertId });
        return false;
    }
}
