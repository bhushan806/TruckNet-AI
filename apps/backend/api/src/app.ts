// ── TruckNet API — Express Application Entry Point ──
// FIX 5:  cookie-parser added for HTTP-only JWT cookies
// FIX 13: MongoDB reconnect logic in mongoose.ts (see that file)
// FIX 14: Security hardening — helmet CSP, dual rate limiters

import express from 'express';
import cors from 'cors';
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
import path from 'path';

// Connect Mongoose (FIX 13: resilient connection with auto-reconnect)
connectMongoose();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer);

// ── FIX 14: Security Headers (Helmet) ──
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            connectSrc: [
                "'self'",
                env.CORS_ORIGIN,
                'https://trucknet-ai-engine.onrender.com',
            ],
            imgSrc: ["'self'", 'data:', 'https:'],
            styleSrc: ["'self'", "'unsafe-inline'"],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ── CORS Configuration & Preflight Handling ──
const allowedOrigins = [
    'https://trucknet-frontend.vercel.app',
    'http://localhost:3000'
];

const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (like mobile apps, curl, or Postman)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};

// 1. Setup CORS middleware
app.use(cors(corsOptions));

// 2. Global OPTIONS Preflight Handler (proper CORS handling)
app.options('*', cors(corsOptions));

// ── FIX 5: Cookie Parser ──
// Must come BEFORE auth middleware reads cookies
app.use(cookieParser());

// ── Logging ──
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Body Parsing ──
app.use(express.json({ limit: '10mb' }));

// ── FIX 14: Global Rate Limiter (100 req / 15 min per IP) ──
const globalLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP. Thodi der mein try karo.',
});
app.use(globalLimiter);

// ── Request Timeout ──
app.use(requestTimeout(30_000));

// ── Response Sanitizer ──
app.use(sanitizeResponse);

// ── Static Uploads ──
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// ── Health Checks ──
app.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'trucknet-api',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
    });
});

app.get('/api/health/complete', async (_req, res) => {
    const mongoose = (await import('mongoose')).default;
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
            database: mongoose.connection.readyState === 1 ? 'up' : 'down',
            uptime: Math.floor(process.uptime()),
            memory: process.memoryUsage(),
        },
    });
});

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
    logger.info(`Server running on port ${PORT}`, { environment: env.NODE_ENV });

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
const shutdown = async () => {
    logger.info('Shutting down gracefully...');
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
    setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
