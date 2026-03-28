import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { logger } from './utils/logger';

// Load env
dotenv.config();

const app = express();
const PORT = process.env.AI_ENGINE_PORT || process.env.PORT || 5001;

// Security and Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ HEALTH ENDPOINT (must be here)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'TruckNet AI Engine',
    timestamp: new Date().toISOString()
  });
});

// DB Connection (with pooling)
if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI, {
        maxPoolSize: 10,
        minPoolSize: 2,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
    }).then(() => {
        logger.info('✅ AI Engine connected to MongoDB');
    }).catch(err => {
        logger.error('❌ MongoDB connection error', { error: err.message });
        process.exit(1);
    });
} else {
    logger.error('❌ MONGODB_URI missing in environment');
    process.exit(1);
}

// Ensure critical envs are present
if (!process.env.JWT_SECRET) {
    logger.error('❌ JWT_SECRET missing in environment');
    process.exit(1);
}



// Import Routes
import dostRoutes from './routes/dost.routes';
import predictiveRoutes from './routes/predictive.routes';

// Mount Routes
app.use('/api/dost', dostRoutes);
app.use('/api/predictive', predictiveRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'AI Engine route not found' });
});

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
    logger.error('AI Engine Error', { error: err.message, stack: err.stack });
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
    });
});

const server = app.listen(PORT, () => {
    logger.info(`🤖 TruckNet AI Engine running on port ${PORT}`);

    // Start Predictive Monitoring
    import('./ai/monitoring.service').then(({ monitoringService }) => {
        monitoringService.start();
        logger.info('🔍 Continuous monitoring started');
    }).catch(err => {
        logger.warn('Predictive monitoring failed to start', { error: err.message });
    });
});

// Graceful Shutdown
const shutdown = async () => {
    logger.info('Shutting down AI Engine gracefully...');
    server.close(async () => {
        logger.info('HTTP server closed');
        await mongoose.connection.close();
        logger.info('Database connection closed');
        
        import('./ai/monitoring.service').then(async ({ monitoringService }) => {
            if ((monitoringService as any)?.isRunning) {
                monitoringService.stop();
                logger.info('Monitoring service stopped');
            }
            process.exit(0);
        }).catch(() => process.exit(0));
    });
    
    setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
