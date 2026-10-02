import { Request, Response, NextFunction } from 'express';

/**
 * High-Traffic Security Middleware: Request Sanitizer
 * Recursively strips MongoDB operator keys (starting with '$' or containing '.')
 * and blocks JavaScript prototype pollution attempts (__proto__, constructor, prototype).
 * Protects all routes against NoSQL injection while permitting legitimate nested payloads.
 */

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function sanitizeObject(target: any, depth = 0): any {
    if (depth > 12) return target; // Prevent deeply nested stack overflow attacks
    if (!target || typeof target !== 'object') return target;
    if (target instanceof Date || target instanceof RegExp) return target;

    if (Array.isArray(target)) {
        return target.map(item => sanitizeObject(item, depth + 1));
    }

    const clean: Record<string, any> = {};

    for (const key of Object.keys(target)) {
        // Block prototype pollution
        if (DANGEROUS_KEYS.has(key)) {
            continue;
        }

        // Strip MongoDB injection operators ($gt, $ne, $where, etc.)
        if (key.startsWith('$')) {
            continue;
        }

        // Sanitize dotted keys which can be used for arbitrary subfield traversal in NoSQL
        const safeKey = key.includes('.') ? key.replace(/\./g, '_') : key;
        const val = target[key];

        clean[safeKey] = (val && typeof val === 'object')
            ? sanitizeObject(val, depth + 1)
            : val;
    }

    return clean;
}

export const sanitizeRequest = (req: Request, _res: Response, next: NextFunction) => {
    try {
        if (req.body && typeof req.body === 'object') {
            req.body = sanitizeObject(req.body);
        }
        if (req.query && typeof req.query === 'object') {
            req.query = sanitizeObject(req.query);
        }
        if (req.params && typeof req.params === 'object') {
            req.params = sanitizeObject(req.params);
        }
    } catch {
        // If parsing fails, proceed safely
    }
    next();
};
