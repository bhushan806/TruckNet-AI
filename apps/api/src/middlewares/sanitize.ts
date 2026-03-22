import { Request, Response, NextFunction } from 'express';

/**
 * Response sanitizer — strips sensitive fields from all JSON responses.
 * Intercepts res.json() to clean data before sending.
 *
 * Works on plain objects only. Mongoose documents are first serialized
 * via JSON.parse(JSON.stringify(...)) to flatten them into POJOs,
 * eliminating circular references from Mongoose internals.
 */
const SENSITIVE_FIELDS = new Set(['password', '__v']);

function sanitizeValue(obj: any, depth = 0): any {
    // Prevent infinite recursion (max 10 levels deep)
    if (depth > 10) return obj;
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    if (obj instanceof Date) return obj;

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeValue(item, depth + 1));
    }

    const clean: any = {};
    for (const key of Object.keys(obj)) {
        if (SENSITIVE_FIELDS.has(key)) continue; // strip entirely
        const value = obj[key];
        clean[key] = (value !== null && typeof value === 'object')
            ? sanitizeValue(value, depth + 1)
            : value;
    }
    return clean;
}

export const sanitizeResponse = (_req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);

    res.json = function (body: any) {
        try {
            if (body && typeof body === 'object') {
                // Flatten Mongoose docs / circular refs into plain JSON first
                const plain = JSON.parse(JSON.stringify(body));
                body = sanitizeValue(plain);
            }
        } catch {
            // If sanitization fails for any reason, send original body
        }
        return originalJson(body);
    };

    next();
};
