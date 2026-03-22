import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class AILoggerService {

    /**
     * Log a prediction made by the AI (or heuristic)
     */
    async logPrediction(
        service: string,
        inputs: any,
        predictedValue: any,
        modelVersion: string = "v1.0",
        rideId?: string,
        driverId?: string,
        confidence?: number
    ) {
        try {
            await prisma.predictionLog.create({
                data: {
                    service,
                    inputs,
                    predictedValue,
                    modelVersion,
                    rideId,
                    driverId,
                    confidence
                }
            });
            logger.info('Prediction logged', { service });
        } catch (error: any) {
            logger.error('Failed to log prediction', { service, error: error.message });
        }
    }

    /**
     * Log a training example (Actual outcome)
     * This is the "Ground Truth" for future training
     */
    async logTrainingData(
        service: string,
        features: any,
        label: any,
        sourceId?: string
    ) {
        try {
            await prisma.trainingData.create({
                data: {
                    service,
                    features,
                    label,
                    sourceId
                }
            });
            logger.info('Training data logged', { service });
        } catch (error: any) {
            logger.error('Failed to log training data', { service, error: error.message });
        }
    }
}
