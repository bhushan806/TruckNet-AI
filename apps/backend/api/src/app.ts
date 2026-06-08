// ── TruckNet API — Express Application Entry Point ──
// SECURITY FIXES APPLIED:
//   - C-3:  CORS now uses explicit allowlist (no more origin:true)
//   - C-7:  Tokens removed from response body (HTTP-only cookies only)
//   - SEC:  Body limit tightened to 100kb (was 10mb — DoS vector)
//   - SEC:  Memory usage removed from public health endpoint
//   - SEC:  /uploads static serving replaced with auth-gated endpoint

import express from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { env } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import { AppError } from './utils/AppError';
import { sanitizeResponse } from './middlewares/sanitize';
import { requestTimeout } from './middlewares/requestTimeout';
import { logger } from './utils/logger';
import { LoadService } from './services/load.service';
import { rateLimiter } from './middlewares/rateLimiter';

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
    // Give logger time to flush, then crash — uncaught exceptions are unrecoverable
    setTimeout(() => process.exit(1), 1000);
});

process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection', { reason: String(reason) });
});

// Import Routes
import authRoutes from './routes/auth.routes';
import vehicleRoutes from './routes/vehicle.routes';
import rideRoutes from './routes/ride.routes';
import loadRoutes from './routes/load.routes';
import matchRoutes from './routes/match.routes';
import roadsideRoutes from './routes/roadside.routes';
import driverRoutes from './routes/driver.routes';
import aiRoutes from './routes/ai.routes';
import assistantRoutes from './routes/assistant.routes';
import requestRoutes from './routes/request.routes';
import financeRoutes from './routes/finance.routes';
import documentRoutes from './routes/document.routes';
import dostRoutes from './routes/dost.routes';
import predictiveRoutes from './routes/predictive.routes';

import { connectMongoose } from './config/mongoose';
import { initSocket } from './config/socket';

// Connect Mongoose (resilient with auto-reconnect)
connectMongoose();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io (JWT-authenticated — see config/socket.ts)
initSocket(httpServer);

// ── FIX C-3: Security Headers (Helmet with tightened CSP) ──
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            connectSrc: [
                "'self'",
                ...(env.CORS_ORIGIN ? env.CORS_ORIGIN.split(',').map(o => o.trim()) : []),
            ],
            imgSrc: ["'self'", 'data:', 'https:'],
            styleSrc: ["'self'", "'unsafe-inline'"],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            frameAncestors: ["'none'"], // Clickjacking protection
            objectSrc: ["'none'"],
        },
    },
    crossOriginResourcePolicy: { policy: 'same-origin' }, // Tightened from cross-origin
    hsts: {
        maxAge: 63072000, // 2 years
        includeSubDomains: true,
        preload: true,
    },
}));

// ── FIX C-3: CORS — Explicit allowlist instead of origin:true ──
// origin:true was reflecting any Origin header → defeats HTTP-only cookie security
const _rawCorsOrigins = (env.CORS_ORIGIN || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

// Always allow localhost in development
if (env.NODE_ENV !== 'production') {
    _rawCorsOrigins.push('http://localhost:3000', 'http://localhost:3001');
}

const ALLOWED_ORIGINS = new Set<string>(_rawCorsOrigins);

logger.info('CORS allowlist configured', { origins: [...ALLOWED_ORIGINS] });

const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
        // Allow same-origin requests (no Origin header) and explicitly allowlisted origins
        if (!origin || ALLOWED_ORIGINS.has(origin)) {
            callback(null, true);
        } else {
            logger.warn('CORS rejected origin', { origin });
            callback(new Error(`CORS policy: origin '${origin}' is not allowed`));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400, // Cache preflight for 24 hours
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ── Cookie Parser (must come BEFORE auth middleware reads cookies) ──
app.use(cookieParser());

// ── Logging ──
// In production use 'combined' format (Apache CLF) — suitable for log aggregators
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Body Parsing — Tightened limits to prevent DoS ──
// FIX: Was 10mb — far too large for JSON API. 100kb handles all legitimate payloads.
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// ── Request Timing Logs (Slow Endpoint Detection) ──
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (duration > 1000) {
            logger.warn('Slow request detected', {
                method: req.method,
                url: req.originalUrl,
                duration: `${duration}ms`,
                status: res.statusCode,
            });
        }
    });
    next();
});

// ── Public Health Checks (before rate limiter) ──
// FIX: Removed process.memoryUsage() from public endpoint — leaks server internals
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Global Rate Limiter (100 req / 15 min per IP) ──
const globalLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP. Please try again later.',
});
app.use(globalLimiter);

// ── Request Timeout ──
app.use(requestTimeout(30_000));

// ── Response Sanitizer ──
app.use(sanitizeResponse);

// ── FIX: Removed public static uploads serving ──
// Before: app.use('/uploads', express.static(...)) — NO access control
// After: Uploads served via GET /api/documents/file/:filename (auth-gated in document.routes.ts)

// ── API Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/loads', loadRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/roadside', roadsideRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/driver', driverRoutes);        // singular alias — frontend uses /api/driver/profile
app.use('/api/assistant', assistantRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/dost', dostRoutes);
app.use('/api/predictive', predictiveRoutes);

// ── 404 Handler ──
app.all('*', (req, _res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// ── Global Error Handler ──
app.use(errorHandler);

// ── Start Server ──
const PORT = env.PORT;
httpServer.listen(PORT, () => {
    logger.info('Server running', { port: PORT, environment: env.NODE_ENV });

    // Start Predictive Intelligence Monitoring (non-blocking)
    import('./ai/monitoring.service').then(({ monitoringService }) => {
        monitoringService.start();
    }).catch(err => {
        logger.warn('Predictive monitoring failed to start', { error: err.message });
    });
});

// ── Background: Load expiration scheduler (every 15 min) ──
const loadService = new LoadService();
setInterval(async () => {
    try {
        const count = await loadService.expireStaleLoads();
        if (count > 0) logger.info('Stale loads expired', { count });
    } catch (error: any) {
        logger.error('Load expiration failed', { error: error.message });
    }
}, 15 * 60 * 1000);

// ── Graceful Shutdown ──
const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully...`);
    httpServer.close(async () => {
        logger.info('HTTP server closed');
        try {
            const mongoose = (await import('mongoose')).default;
            await mongoose.connection.close();
            logger.info('Database connection closed');
        } catch (err: any) {
            logger.error('Error closing DB', { error: err.message });
        }
        process.exit(0);
    });

    // Force exit after 10s if graceful shutdown stalls
    setTimeout(() => {
        logger.error('Forced shutdown — graceful shutdown timed out');
        process.exit(1);
    }, 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
