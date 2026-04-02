import axios from 'axios';
import { env } from '../config/env';
import { logger } from '../utils/logger';

// Base URL for AI Engine
const AI_ENGINE_URL = env.AI_ENGINE_URL;
const AI_TIMEOUT_MS = 5000;
const AI_MAX_RETRIES = 2;

export interface AiContext {
    current_location?: string;
    destination?: string;
    current_earnings?: number;
    idle_truck_count?: number;
    active_shipments?: number;
    [key: string]: any;
}

/**
 * Retry with exponential backoff.
 * Delays: 500ms, 1500ms (base * 2^attempt)
 */
async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries: number): Promise<T> {
    let lastError: any;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (attempt < maxRetries) {
                const delay = 500 * Math.pow(2, attempt);
                logger.warn('AI call failed, retrying', { attempt: attempt + 1, delay });
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError;
}

export class AiService {
    /**
     * Fetches role-based insights from the Python AI Engine.
     * Includes timeout, retry with backoff, and safe fallback.
     * AI failure NEVER blocks lifecycle.
     */
    async getInsights(role: string, userId: string, context: AiContext) {
        try {
            const result = await retryWithBackoff(async () => {
                const response = await axios.post(
                    `${AI_ENGINE_URL}/get-insights`,
                    { role, user_id: userId, context },
                    { timeout: AI_TIMEOUT_MS }
                );
                return response.data;
            }, AI_MAX_RETRIES);

            return result;
        } catch (error: any) {
            logger.error('AI service failed after retries', {
                role,
                error: error.message,
            });
            // Safe fallback — never block the caller
            return {
                summary: 'AI Service Temporarily Unavailable',
                top_recommendations: [],
                insights: [],
                confidence_score: 0.0,
                explanation: 'Connection to AI Engine failed. Please try again later.',
            };
        }
    }
}
