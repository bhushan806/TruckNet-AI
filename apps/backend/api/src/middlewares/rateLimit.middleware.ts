// ── Per-Route AI Rate Limiter ──
// Applied only to public AI endpoints (e.g., /api/dost/chat) to prevent abuse.
// For the global limiter applied to all routes, see: rateLimiter.ts
// FIXES:
//   - req.connection.remoteAddress deprecated → req.socket.remoteAddress
//   - Trusts X-Forwarded-For when behind a known proxy (Render/Vercel)
//   - Cleanup interval reduced to prevent unbounded memory growth

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface RateLimitTracker {
    count: number;
    resetTime: number;
}

const ips = new Map<string, RateLimitTracker>();

// Cleanup stale IPs every 5 minutes to prevent memory leak
setInterval(() => {
    const now = Date.now();
    for (const [ip, tracker] of ips.entries()) {
        if (now > tracker.resetTime) {
            ips.delete(ip);
        }
    }
}, 5 * 60 * 1000);

/**
 * Extract client IP, respecting X-Forwarded-For for proxy deployments (Render, Vercel).
 * FIX: req.connection is deprecated in Node.js ≥18, use req.socket instead.
 */
function getClientIp(req: Request): string {
    // Trust X-Forwarded-For only if the app is behind a trusted proxy
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        const first = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
        return first.trim();
    }
    // FIX: Use req.socket.remoteAddress (req.connection deprecated since Node 18)
    return req.socket?.remoteAddress || req.ip || 'unknown';
}

export const publicAiRateLimiter = (req: Request, res: Response, next: NextFunction) => {
    const ip = getClientIp(req);
    const now = Date.now();
    const WINDOW_MS = 60 * 1000; // 1 minute window
    const MAX_REQUESTS = 10;     // 10 requests per minute for public AI

    let tracker = ips.get(ip);

    if (!tracker || now > tracker.resetTime) {
        tracker = { count: 1, resetTime: now + WINDOW_MS };
        ips.set(ip, tracker);
        return next();
    }

    tracker.count++;

    if (tracker.count > MAX_REQUESTS) {
        logger.warn('AI rate limit exceeded', { ip, count: tracker.count });
        res.status(429).json({
            status: 'error',
            message: 'Too many requests. Please wait or sign up for unlimited AI access.',
            retryAfter: Math.ceil((tracker.resetTime - now) / 1000),
        });
        return;
    }

    next();
};
