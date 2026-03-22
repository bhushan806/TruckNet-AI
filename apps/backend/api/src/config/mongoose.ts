import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

export const connectMongoose = async () => {
    try {
        await mongoose.connect(env.DATABASE_URL, {
            maxPoolSize: 10,
            minPoolSize: 2,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
        });
        // SECURITY: Never log the connection string itself
        logger.info('Mongoose connected successfully');
    } catch (error) {
        logger.error('Mongoose connection failed', { error: (error as any).message });
        process.exit(1);
    }
};
