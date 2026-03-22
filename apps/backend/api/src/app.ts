import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { env } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import { AppError } from './utils/AppError';
import { sanitizeResponse } from './middlewares/sanitize';
import { requestTimeout } from './middlewares/requestTimeout';
import { logger } from './utils/logger';
import { LoadService } from './services/load.service';

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
// AI routes have been moved to ai-node-engine microservice

import { connectMongoose } from './config/mongoose';

// Connect Mongoose
connectMongoose();

import { initSocket } from './config/socket';

import path from 'path';

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer);

// ── Global Middleware ──
app.use(helmet());
// SECURITY: CORS restricted to configured frontend origin (env CORS_ORIGIN)
app.use(cors({
    origin: env.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
}));
// Use 'combined' format in production for audit logs, 'dev' for readability locally
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(requestTimeout(30_000));  // 30s request timeout
app.use(sanitizeResponse);        // Strip sensitive fields from responses

// Serve Static Uploads
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// ── Health Check ──
app.get('/api/health', (_req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'TruckNet API is running',
        data: {
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            environment: env.NODE_ENV,
        },
    });
});

app.get('/api/health/complete', async (_req, res) => {
    const mongoose = (await import('mongoose')).default;
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
            database: mongoose.connection.readyState === 1 ? 'up' : 'down',
            uptime: process.uptime(),
            memory: process.memoryUsage()
        }
    });
});

// ── API Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/loads', loadRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/roadside', roadsideRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/documents', documentRoutes);
// AI routes proxy/moved to ai-node-engine

// ── 404 Handler ──
app.all('*', (req, _res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// ── Global Error Handler ──
app.use(errorHandler);

// ── Start Server ──
const PORT = process.env.API_PORT || env.PORT || 5000;
httpServer.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`, { environment: env.NODE_ENV });

    // ── Start Predictive Intelligence Monitoring (non-blocking) ──
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
