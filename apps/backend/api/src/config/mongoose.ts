// ── Mongoose Connection ──
// FIX 13: Resilient connection with auto-reconnect on disconnect.
// MongoDB Atlas silently drops idle connections — this watches for disconnects and re-connects.

import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

const MONGO_OPTIONS = {
    serverSelectionTimeoutMS: 10_000,   // Fail fast if Atlas is unreachable
    heartbeatFrequencyMS: 30_000,       // Ping Atlas every 30s to maintain connection
    socketTimeoutMS: 45_000,            // Wait 45s before treating a socket as dead
    maxPoolSize: 10,                    // Max simultaneous connections
    minPoolSize: 2,                     // Keep at least 2 connections warm
    retryWrites: true,
    retryReads: true,
};

let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

export const connectMongoose = async (): Promise<void> => {
    try {
        await mongoose.connect(env.DATABASE_URL, MONGO_OPTIONS);
        // SECURITY: Never log the connection string itself — it contains credentials
        logger.info('MongoDB connected successfully');
    } catch (err: any) {
        logger.error('MongoDB initial connection failed', { error: err.message });
        // Fail fast on startup — app cannot function without DB
        process.exit(1);
    }
};

// ── Connection event handlers ──

mongoose.connection.on('connected', () => {
    logger.info('MongoDB connection established');
    // Clear any pending reconnect timer
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }
});

mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected — scheduling reconnect in 5 seconds');
    // Avoid stacking multiple reconnect attempts
    if (!reconnectTimeout) {
        reconnectTimeout = setTimeout(async () => {
            reconnectTimeout = null;
            logger.info('Attempting MongoDB reconnect...');
            try {
                await mongoose.connect(env.DATABASE_URL, MONGO_OPTIONS);
            } catch (err: any) {
                logger.error('MongoDB reconnect failed', { error: err.message });
                // Will retry again on next 'disconnected' event
            }
        }, 5_000);
    }
});

mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected successfully');
});

mongoose.connection.on('error', (err) => {
    logger.error('MongoDB runtime error', { error: err.message });
});

// Graceful shutdown — close DB connection cleanly
process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed on app shutdown (SIGINT)');
    } catch (err: any) {
        logger.error('Error closing MongoDB on shutdown', { error: err.message });
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed on app shutdown (SIGTERM)');
    } catch (err: any) {
        logger.error('Error closing MongoDB on shutdown', { error: err.message });
    }
    // Don't exit — let Express handle SIGTERM gracefully
});
