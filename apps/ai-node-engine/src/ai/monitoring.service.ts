// ── AI Module: Continuous Monitoring Service ──
// Background loop that checks all active shipments every 10-30 seconds.
// Orchestrates risk prediction → decision → alerting pipeline.
// Auto-starts when the AI engine boots.

import { logger } from '../utils/logger';
import { LoadModel } from '../models/mongoose/Load';
import { predictShipmentRisk } from './riskPrediction.service';
import { makeDecision } from './decisionEngine.service';
import { createAlert, escalateUnacknowledgedAlerts } from './alertEngine.service';
import { analyzeNetworkPatterns } from './networkIntelligence.service';
import { generateHeatmap } from './heatmap.service';
import type { RiskPredictionResult } from './types/predictive.types';

class MonitoringService {
    private isRunning = false;
    private cycleCount = 0;
    private baseIntervalMs = 15000; // 15 seconds default

    /**
     * Start the monitoring loop.
     * Non-blocking — runs in the background via setTimeout.
     */
    async start(): Promise<void> {
        if (this.isRunning) {
            logger.warn('Monitoring service already running');
            return;
        }

        this.isRunning = true;
        logger.info('🔮 Predictive Monitoring Service started', {
            intervalMs: this.baseIntervalMs,
        });

        // Start the loop (non-blocking)
        this.scheduleNextCycle();
    }

    /**
     * Stop the monitoring loop gracefully.
     */
    stop(): void {
        this.isRunning = false;
        logger.info('Monitoring service stopped');
    }

    /**
     * Schedule the next monitoring cycle with jitter.
     */
    private scheduleNextCycle(): void {
        if (!this.isRunning) return;

        const delay = this.getJitteredDelay();
        setTimeout(async () => {
            await this.monitoringCycle();
            this.scheduleNextCycle(); // schedule next after current completes
        }, delay);
    }

    /**
     * Main monitoring cycle.
     *
     * 1. Fetch all IN_TRANSIT / ASSIGNED_TO_DRIVER shipments
     * 2. Run risk prediction for each (parallel via Promise.allSettled)
     * 3. If risk > MEDIUM → decision engine → alert engine
     * 4. Every 5 cycles → network intelligence
     * 5. Every cycle → update heatmap cache
     */
    private async monitoringCycle(): Promise<void> {
        const cycleStart = Date.now();
        this.cycleCount++;

        let shipmentsProcessed = 0;
        let alertsGenerated = 0;
        let errors = 0;

        try {
            // 1. Fetch active shipments
            const activeLoads = await LoadModel.find({
                status: { $in: ['IN_TRANSIT', 'ASSIGNED_TO_DRIVER'] },
            }).lean().limit(100); // cap to prevent overload

            if (activeLoads.length === 0) {
                // No active shipments — still update heatmap with empty data
                await generateHeatmap([]);
                return;
            }

            shipmentsProcessed = activeLoads.length;

            // 2. Run risk prediction for each shipment in parallel
            const predictionResults = await Promise.allSettled(
                activeLoads.map(load => {
                    const shipmentId = (load._id || '').toString();
                    return predictShipmentRisk({
                        shipmentId,
                        currentLocation: {
                            lat: (load as any).pickupLat || 18.52,
                            lng: (load as any).pickupLng || 73.85,
                        },
                        plannedRoute: [
                            { lat: (load as any).pickupLat || 18.52, lng: (load as any).pickupLng || 73.85, name: (load as any).source },
                            { lat: (load as any).dropLat || 19.07, lng: (load as any).dropLng || 72.87, name: (load as any).destination },
                        ],
                        originCity: (load as any).source,
                        destinationCity: (load as any).destination,
                        goodsType: (load as any).goodsType,
                    });
                })
            );

            // 3. Process predictions — decision + alert for risky shipments
            const successfulPredictions: RiskPredictionResult[] = [];
            const shipmentMeta: Array<{ shipmentId: string; lat: number; lng: number; city?: string }> = [];

            for (let i = 0; i < predictionResults.length; i++) {
                const result = predictionResults[i];
                const load = activeLoads[i] as any;

                if (result.status === 'fulfilled') {
                    const prediction = result.value;
                    successfulPredictions.push(prediction);

                    shipmentMeta.push({
                        shipmentId: prediction.shipmentId,
                        lat: load.pickupLat || 18.52,
                        lng: load.pickupLng || 73.85,
                        city: load.source,
                    });

                    // If risk is MEDIUM or higher → decision engine → alert engine
                    if (prediction.riskLevel !== 'LOW') {
                        try {
                            const decision = await makeDecision(prediction);

                            // Create alert for HIGH and CRITICAL only (avoid alert fatigue)
                            if (prediction.riskLevel === 'HIGH' || prediction.riskLevel === 'CRITICAL') {
                                const userId = (load.customerId || load.ownerId || '').toString();
                                const alert = await createAlert(prediction, decision, userId);
                                if (alert) alertsGenerated++;
                            }
                        } catch (decisionErr: any) {
                            errors++;
                            logger.warn('Decision/alert failed for shipment', {
                                shipmentId: prediction.shipmentId,
                                error: decisionErr.message,
                            });
                        }
                    }
                } else {
                    errors++;
                    logger.warn('Risk prediction failed for load', {
                        loadId: (load._id || '').toString(),
                        error: result.reason?.message || 'Unknown error',
                    });
                }
            }

            // 4. Every 5 cycles (~75s) → network intelligence
            if (this.cycleCount % 5 === 0 && successfulPredictions.length > 0) {
                try {
                    const networkStatus = await analyzeNetworkPatterns(successfulPredictions, shipmentMeta);
                    // 5. Update heatmap with network data
                    await generateHeatmap(networkStatus);

                    // Also check for alert escalation
                    const escalated = await escalateUnacknowledgedAlerts();
                    if (escalated > 0) {
                        logger.info('Escalated stale alerts', { count: escalated });
                    }
                } catch (networkErr: any) {
                    logger.warn('Network intelligence cycle failed', { error: networkErr.message });
                }
            } else {
                // Still update heatmap every cycle (with last known network data or empty)
                await generateHeatmap([]);
            }
        } catch (error: any) {
            errors++;
            logger.error('Monitoring cycle failed', { error: error.message, cycle: this.cycleCount });
        }

        const durationMs = Date.now() - cycleStart;
        if (shipmentsProcessed > 0 || this.cycleCount % 10 === 0) {
            logger.info('Monitoring cycle completed', {
                cycle: this.cycleCount,
                shipmentsProcessed,
                alertsGenerated,
                errors,
                durationMs,
            });
        }
    }

    /**
     * Returns a jittered delay between 10000-30000 ms.
     * Prevents thundering herd when multiple instances run.
     */
    private getJitteredDelay(): number {
        const jitter = Math.random() * 20000; // 0-20s
        return 10000 + jitter; // 10-30s range
    }
}

// Singleton instance
export const monitoringService = new MonitoringService();
