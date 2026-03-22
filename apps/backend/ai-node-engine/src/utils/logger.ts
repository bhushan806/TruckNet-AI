// ── Structured Logger ──
// Strips sensitive fields and outputs JSON in production, readable in dev.

const SENSITIVE_KEYS = ['password', 'refreshToken', 'accessToken', 'token', 'authorization', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];

function stripSensitive(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(stripSensitive);

    const clean: any = {};
    for (const [key, value] of Object.entries(obj)) {
        if (SENSITIVE_KEYS.includes(key)) {
            clean[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
            clean[key] = stripSensitive(value);
        } else {
            clean[key] = value;
        }
    }
    return clean;
}

function formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const base = { timestamp, level, message };

    if (meta) {
        return JSON.stringify({ ...base, ...stripSensitive(meta) });
    }
    return JSON.stringify(base);
}

export const logger = {
    info(message: string, meta?: any) {
        console.log(formatMessage('INFO', message, meta));
    },
    warn(message: string, meta?: any) {
        console.warn(formatMessage('WARN', message, meta));
    },
    error(message: string, meta?: any) {
        console.error(formatMessage('ERROR', message, meta));
    },
    debug(message: string, meta?: any) {
        if (process.env.NODE_ENV !== 'production') {
            console.debug(formatMessage('DEBUG', message, meta));
        }
    },
};
