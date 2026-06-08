// ── Predictive Intelligence API Routes ──
// SECURITY FIXES:
//   - C-4: ALL routes now require authentication (protect middleware)
//   - C-5: IDOR fixed — /alerts reads userId from JWT, not URL param
//   - C-5b: alert acknowledge validates ownership via userId
//   - Input validation on all params/query strings

import { Router, Request, Response } from 'express';
import { protect, authorize, AuthRequest } from '../middlewares/auth.middleware';
import { getCachedHeatmap } from '../ai/heatmap.service';
import { predictShipmentRisk } from '../ai/riskPrediction.service';
import { getAlertsByUser, acknowledgeAlert } from '../ai/alertEngine.service';
import { analyzeNetworkPatterns } from '../ai/networkIntelligence.service';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// ── FIX C-4: ALL predictive routes require authentication ──
router.use(protect);

// ── GET /api/predictive/heatmap ──
// Returns latest cached heatmap data — available to all authenticated users
router.get('/heatmap', async (_req: AuthRequest, res: Response) => {
    try {
        const heatmap = getCachedHeatmap();
        res.json({ status: 'success', data: heatmap });
    } catch (error: any) {
        logger.error('Heatmap endpoint failed', { error: error.message });
        res.status(500).json({ status: 'error', message: 'Failed to fetch heatmap data' });
    }
});

// ── FIX C-5: GET /api/predictive/alerts ──
// IDOR FIXED: userId now comes from JWT (req.user.id), NOT from URL param
// Before: GET /alerts/:userId → any user could fetch any user's alerts
// After:  GET /alerts → returns only the authenticated user's own alerts
router.get('/alerts', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id; // Always use server-side identity

        // Validate limit query param
        const rawLimit = parseInt(req.query.limit as string);
        const limit = isNaN(rawLimit) ? 20 : Math.min(Math.max(1, rawLimit), 100);

        const alerts = await getAlertsByUser(userId, limit);
        res.json({ status: 'success', data: alerts });
    } catch (error: any) {
        logger.error('Alerts endpoint failed', { error: error.message });
        res.status(500).json({ status: 'error', message: 'Failed to fetch alerts' });
    }
});

// ── FIX C-5b: POST /api/predictive/alerts/:alertId/acknowledge ──
// Ownership validated: only the alert owner can acknowledge
router.post('/alerts/:alertId/acknowledge', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { alertId } = req.params;

        if (!alertId || alertId.length < 1) {
            res.status(400).json({ status: 'error', message: 'Invalid alert ID' });
            return;
        }

        // acknowledgeAlert must internally verify userId owns the alert
        const success = await acknowledgeAlert(alertId, userId);

        if (!success) {
            res.status(404).json({
                status: 'error',
                message: 'Alert not found or not authorized to acknowledge',
            });
            return;
        }

        res.json({ status: 'success', acknowledged: true });
    } catch (error: any) {
        logger.error('Alert acknowledge failed', { error: error.message });
        res.status(500).json({ status: 'error', message: 'Failed to acknowledge alert' });
    }
});

// ── POST /api/predictive/risk/:shipmentId ──
// On-demand risk prediction — requires auth, validates input
const riskRequestSchema = z.object({
    currentLocation: z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
    }).optional(),
    plannedRoute: z.array(z.object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
    })).min(2).max(50).optional(),
    originCity: z.string().max(100).optional(),
    destinationCity: z.string().max(100).optional(),
    weatherData: z.any().optional(),
    trafficData: z.any().optional(),
});

router.post('/risk/:shipmentId', async (req: AuthRequest, res: Response) => {
    try {
        const { shipmentId } = req.params;

        if (!shipmentId) {
            res.status(400).json({ status: 'error', message: 'shipmentId is required' });
            return;
        }

        const body = riskRequestSchema.parse(req.body);

        const prediction = await predictShipmentRisk({
            shipmentId,
            currentLocation: body.currentLocation || { lat: 18.52, lng: 73.85 },
            plannedRoute: body.plannedRoute || [
                { lat: 18.52, lng: 73.85 },
                { lat: 19.07, lng: 72.87 },
            ],
            originCity: body.originCity,
            destinationCity: body.destinationCity,
            weatherData: body.weatherData,
            trafficData: body.trafficData,
        });

        res.json({ status: 'success', data: prediction });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            res.status(400).json({ status: 'error', message: 'Invalid request body' });
            return;
        }
        logger.error('Risk prediction endpoint failed', { error: error.message });
        res.status(500).json({ status: 'error', message: 'Failed to predict risk' });
    }
});

// ── GET /api/predictive/network ──
// Network intelligence — restricted to OWNER and ADMIN roles
router.get('/network', authorize('OWNER', 'ADMIN'), async (_req: AuthRequest, res: Response) => {
    try {
        const status = await analyzeNetworkPatterns([], []);
        res.json({ status: 'success', data: status });
    } catch (error: any) {
        logger.error('Network endpoint failed', { error: error.message });
        res.status(500).json({ status: 'error', message: 'Failed to fetch network data' });
    }
});

export default router;
