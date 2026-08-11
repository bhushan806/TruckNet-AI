// ── TruckNet Traffic Monitor ──
// In-memory application traffic metrics for the Admin Dashboard.
//
// IMPORTANT: These metrics are INSTANCE-LEVEL and RESET ON SERVER RESTART.
// They are NOT persistent historical analytics.
// This is acceptable for the current MVP/Eureka environment.
// Design is forward-compatible: replace the 'store' with Redis calls
// without changing the Admin API shape.
//
// Architecture mirrors the existing rateLimiter.ts pattern.

import { Request, Response, NextFunction } from 'express';

interface EndpointStat {
    count: number;
    errors: number;
    totalLatencyMs: number;
}

interface HourlyBucket {
    requests: number;
    errors: number;
    timestamp: number; // hour epoch (floor to hour)
}

interface TrafficStore {
    totalRequests: number;
    totalErrors: number;
    totalLatencyMs: number;
    activeRequests: number;
    startedAt: Date;
    endpoints: Map<string, EndpointStat>;
    statusCodes: Map<number, number>;
    // Rolling 24-bucket circular buffer (one per hour over 24h)
    hourlyBuckets: HourlyBucket[];
    // Per-minute sliding window (last 60 seconds of request counts)
    minuteWindow: number[];   // ring buffer, 60 slots
    minuteWindowIdx: number;
    minuteWindowUpdatedAt: number;
}

const store: TrafficStore = {
    totalRequests: 0,
    totalErrors: 0,
    totalLatencyMs: 0,
    activeRequests: 0,
    startedAt: new Date(),
    endpoints: new Map(),
    statusCodes: new Map(),
    hourlyBuckets: [],
    minuteWindow: new Array(60).fill(0),
    minuteWindowIdx: 0,
    minuteWindowUpdatedAt: Date.now(),
};

// ── Helper: floor timestamp to current hour epoch ──
function hourEpoch(ts: number = Date.now()): number {
    return Math.floor(ts / 3_600_000) * 3_600_000;
}

// ── Helper: get or init current hourly bucket ──
function getOrCreateHourBucket(): HourlyBucket {
    const epoch = hourEpoch();
    let bucket = store.hourlyBuckets.find(b => b.timestamp === epoch);
    if (!bucket) {
        bucket = { requests: 0, errors: 0, timestamp: epoch };
        store.hourlyBuckets.push(bucket);
        // Keep only last 48 hours
        if (store.hourlyBuckets.length > 48) {
            store.hourlyBuckets.shift();
        }
    }
    return bucket;
}

// ── Advance the per-minute ring buffer if time has passed ──
function advanceMinuteWindow(): void {
    const now = Date.now();
    const secondsElapsed = Math.floor((now - store.minuteWindowUpdatedAt) / 1000);
    if (secondsElapsed <= 0) return;

    const steps = Math.min(secondsElapsed, 60);
    for (let i = 0; i < steps; i++) {
        store.minuteWindowIdx = (store.minuteWindowIdx + 1) % 60;
        store.minuteWindow[store.minuteWindowIdx] = 0;
    }
    store.minuteWindowUpdatedAt = now;
}

// ── Express middleware — mount BEFORE routes in app.ts ──
export function trafficMonitorMiddleware(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    store.activeRequests++;
    store.totalRequests++;

    // Advance minute window
    advanceMinuteWindow();
    store.minuteWindow[store.minuteWindowIdx]++;

    // Hour bucket
    getOrCreateHourBucket().requests++;

    res.on('finish', () => {
        store.activeRequests = Math.max(0, store.activeRequests - 1);
        const latency = Date.now() - start;
        store.totalLatencyMs += latency;

        const status = res.statusCode;
        store.statusCodes.set(status, (store.statusCodes.get(status) || 0) + 1);

        const isError = status >= 400;
        if (isError) {
            store.totalErrors++;
            getOrCreateHourBucket().errors++;
        }

        // Endpoint tracking — strip dynamic segments for grouping
        const key = `${req.method} ${req.route?.path || req.path}`;
        const ep = store.endpoints.get(key) || { count: 0, errors: 0, totalLatencyMs: 0 };
        ep.count++;
        ep.totalLatencyMs += latency;
        if (isError) ep.errors++;
        store.endpoints.set(key, ep);
    });

    next();
}

// ── Exported metrics getter (called by admin service) ──
export function getTrafficMetrics() {
    advanceMinuteWindow();

    const now = Date.now();
    const uptime = now - store.startedAt.getTime();

    // Today (since midnight IST / UTC+5:30)
    const midnightToday = new Date();
    midnightToday.setHours(0, 0, 0, 0);
    const todayBuckets = store.hourlyBuckets.filter(b => b.timestamp >= midnightToday.getTime());
    const requestsToday = todayBuckets.reduce((sum, b) => sum + b.requests, 0);
    const errorsToday = todayBuckets.reduce((sum, b) => sum + b.errors, 0);

    // This hour
    const thisHourBucket = store.hourlyBuckets.find(b => b.timestamp === hourEpoch()) || { requests: 0, errors: 0 };

    // Requests/min (sum of last 60 second-slots)
    const requestsPerMinute = store.minuteWindow.reduce((a, b) => a + b, 0);

    // Average latency
    const avgLatencyMs = store.totalRequests > 0
        ? Math.round(store.totalLatencyMs / store.totalRequests)
        : 0;

    // Error rate
    const errorRate = store.totalRequests > 0
        ? parseFloat(((store.totalErrors / store.totalRequests) * 100).toFixed(2))
        : 0;

    // Top endpoints
    const topEndpoints = Array.from(store.endpoints.entries())
        .map(([endpoint, s]) => ({
            endpoint,
            count: s.count,
            errors: s.errors,
            avgLatencyMs: Math.round(s.totalLatencyMs / s.count),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);

    // Status code distribution
    const statusDistribution: Record<string, number> = {};
    store.statusCodes.forEach((count, code) => {
        statusDistribution[String(code)] = count;
    });

    // Hourly chart data (last 24h)
    const hourlyChart = Array.from({ length: 24 }, (_, i) => {
        const ts = hourEpoch(now - i * 3_600_000);
        const b = store.hourlyBuckets.find(b => b.timestamp === ts);
        return {
            hour: new Date(ts).toISOString(),
            requests: b?.requests || 0,
            errors: b?.errors || 0,
        };
    }).reverse();

    return {
        meta: {
            note: 'Instance-level in-memory metrics. Resets on backend restart.',
            instanceStartedAt: store.startedAt.toISOString(),
            uptimeMs: uptime,
            uptimeHuman: formatUptime(uptime),
        },
        summary: {
            totalRequests: store.totalRequests,
            requestsToday,
            requestsThisHour: thisHourBucket.requests,
            requestsPerMinute,
            activeRequests: store.activeRequests,
            totalErrors: store.totalErrors,
            errorsToday,
            avgLatencyMs,
            errorRate,
        },
        statusDistribution,
        topEndpoints,
        hourlyChart,
    };
}

function formatUptime(ms: number): string {
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    const s = Math.floor((ms % 60_000) / 1000);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}
