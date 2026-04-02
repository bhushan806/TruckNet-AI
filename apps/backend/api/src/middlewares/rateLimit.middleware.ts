// ── Per-Route AI Rate Limiter ──
// Applied only to public AI endpoints (e.g., /api/ai/insights) to prevent abuse.
// For the global limiter applied to all routes, see: rateLimiter.ts

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface RateLimitTracker {
    count: number;
    resetTime: number;
}

const ips = new Map<string, RateLimitTracker>();

// Cleanup stale IPs every 10 minutes to prevent memory leak
setInterval(() => {
    const now = Date.now();
    for (const [ip, tracker] of ips.entries()) {
        if (now > tracker.resetTime) {
            ips.delete(ip);
        }
    }
}, 10 * 60 * 1000);

export const publicAiRateLimiter = (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const WINDOW_MS = 60 * 1000; // 1 minute window
    const MAX_REQUESTS = 10;     // 10 requests per minute

    let tracker = ips.get(ip);

    if (!tracker || now > tracker.resetTime) {
        tracker = { count: 1, resetTime: now + WINDOW_MS };
        ips.set(ip, tracker);
        return next();
    }

    tracker.count++;
    
    if (tracker.count > MAX_REQUESTS) {
        logger.warn('Rate limit exceeded for IP', { ip, count: tracker.count });
        res.status(429).json({
            status: 'error',
            message: 'Too many requests. Please wait or sign up for unlimited AI access.'
        });
        return;
    }

    next();
};
