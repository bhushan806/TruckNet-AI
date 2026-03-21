import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

/**
 * In-memory rate limiter (no Redis dependency).
 * Each instance tracks requests per IP in a sliding window.
 */
interface RateLimitEntry {
    count: number;
    resetAt: number;
}

export function rateLimiter(opts: { windowMs: number; max: number; message?: string }) {
    const store = new Map<string, RateLimitEntry>();
    const { windowMs, max, message } = opts;

    // Periodic cleanup every 60s
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of store.entries()) {
            if (entry.resetAt <= now) store.delete(key);
        }
    }, 60_000);

    return (req: Request, _res: Response, next: NextFunction) => {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const now = Date.now();

        const entry = store.get(ip);

        if (!entry || entry.resetAt <= now) {
            store.set(ip, { count: 1, resetAt: now + windowMs });
            return next();
        }

        entry.count++;

        if (entry.count > max) {
            return next(new AppError(message || 'Too many requests, please try again later', 429));
        }

        next();
    };
}

// Pre-configured limiters
export const authLimiter = rateLimiter({ windowMs: 60_000, max: 10, message: 'Too many auth attempts, try again in 1 minute' });
export const loadAcceptLimiter = rateLimiter({ windowMs: 60_000, max: 5, message: 'Too many load acceptance attempts' });
export const driverStatusLimiter = rateLimiter({ windowMs: 60_000, max: 10, message: 'Too many status updates' });
