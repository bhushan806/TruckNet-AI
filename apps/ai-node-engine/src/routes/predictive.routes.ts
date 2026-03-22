// ── Predictive Intelligence API Routes ──
// Exposes new predictive endpoints WITHOUT touching existing /api/ai/* routes.

import { Router, Request, Response } from 'express';
import { getCachedHeatmap } from '../ai/heatmap.service';
import { predictShipmentRisk } from '../ai/riskPrediction.service';
import { getAlertsByUser, acknowledgeAlert } from '../ai/alertEngine.service';
import { analyzeNetworkPatterns } from '../ai/networkIntelligence.service';
import { logger } from '../utils/logger';

const router = Router();

// ── GET /api/ai/predictive/heatmap ──
// Returns latest cached heatmap data for frontend map overlay
router.get('/heatmap', (_req: Request, res: Response) => {
    try {
        const heatmap = getCachedHeatmap();
        res.json({ status: 'success', data: heatmap });
    } catch (error: any) {
        logger.error('Heatmap endpoint failed', { error: error.message });
        res.status(500).json({ status: 'error', message: 'Failed to fetch heatmap data' });
    }
});

// ── GET /api/ai/predictive/alerts/:userId ──
// Returns alerts for a specific user
router.get('/alerts/:userId', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit as string) || 20;
        const alerts = await getAlertsByUser(userId, limit);
        res.json({ status: 'success', data: alerts });
    } catch (error: any) {
        logger.error('Alerts endpoint failed', { error: error.message });
        res.status(500).json({ status: 'error', message: 'Failed to fetch alerts' });
    }
});

// ── POST /api/ai/predictive/alerts/:alertId/acknowledge ──
// Acknowledge an alert
router.post('/alerts/:alertId/acknowledge', async (req: Request, res: Response) => {
    try {
        const { alertId } = req.params;
        const success = await acknowledgeAlert(alertId);
        res.json({ status: 'success', acknowledged: success });
    } catch (error: any) {
        logger.error('Alert acknowledge failed', { error: error.message });
        res.status(500).json({ status: 'error', message: 'Failed to acknowledge alert' });
    }
});

// ── POST /api/ai/predictive/risk/:shipmentId ──
// On-demand risk prediction for a specific shipment
router.post('/risk/:shipmentId', async (req: Request, res: Response) => {
    try {
        const { shipmentId } = req.params;
        const { currentLocation, plannedRoute, originCity, destinationCity, weatherData, trafficData } = req.body;

        const prediction = await predictShipmentRisk({
            shipmentId,
            currentLocation: currentLocation || { lat: 18.52, lng: 73.85 },
            plannedRoute: plannedRoute || [
                { lat: 18.52, lng: 73.85 },
                { lat: 19.07, lng: 72.87 },
            ],
            originCity,
            destinationCity,
            weatherData,
            trafficData,
        });

        res.json({ status: 'success', data: prediction });
    } catch (error: any) {
        logger.error('Risk prediction endpoint failed', { error: error.message });
        res.status(500).json({ status: 'error', message: 'Failed to predict risk' });
    }
});

// ── GET /api/ai/predictive/network ──
// Returns latest network intelligence summary
router.get('/network', async (_req: Request, res: Response) => {
    try {
        // Run on-demand network analysis with empty data (monitoring fills the cache)
        const status = await analyzeNetworkPatterns([], []);
        res.json({ status: 'success', data: status });
    } catch (error: any) {
        logger.error('Network endpoint failed', { error: error.message });
        res.status(500).json({ status: 'error', message: 'Failed to fetch network data' });
    }
});

export default router;
