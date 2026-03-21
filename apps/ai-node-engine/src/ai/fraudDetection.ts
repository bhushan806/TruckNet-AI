// ── AI Module: Fraud Detection ──
// Detects potentially fraudulent transactions and behaviors.
// Called only via services layer, NEVER directly from routes.

import { logger } from '../utils/logger';

export interface TransactionSignal {
    userId: string;
    amount: number;
    frequency: number;         // transactions in last 24h
    averageAmount: number;     // user's historical average
    locationMismatch: boolean; // origin/destination vs. usual routes
    isNewUser: boolean;        // account < 7 days old
    tripDistance: number;      // in km
}

export interface FraudAssessment {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    riskScore: number;         // 0-100
    flags: string[];
    recommendation: 'APPROVE' | 'REVIEW' | 'BLOCK';
}

/**
 * Evaluates a transaction for potential fraud using rule-based scoring.
 *
 * In production, this would be augmented with ML anomaly detection.
 * Current implementation uses weighted rule-based scoring.
 */
export async function assessFraudRisk(signal: TransactionSignal): Promise<FraudAssessment> {
    try {
        let riskScore = 0;
        const flags: string[] = [];

        // Rule 1: Amount anomaly (>3x average)
        if (signal.averageAmount > 0 && signal.amount > signal.averageAmount * 3) {
            riskScore += 25;
            flags.push('Transaction amount significantly above user average');
        }

        // Rule 2: High frequency (>10 transactions in 24h)
        if (signal.frequency > 10) {
            riskScore += 20;
            flags.push('Unusually high transaction frequency');
        }

        // Rule 3: Location mismatch
        if (signal.locationMismatch) {
            riskScore += 15;
            flags.push('Route deviates from user established patterns');
        }

        // Rule 4: New user + high value
        if (signal.isNewUser && signal.amount > 50000) {
            riskScore += 25;
            flags.push('High-value transaction from new account');
        }

        // Rule 5: Suspiciously short trip with high charge
        if (signal.tripDistance > 0 && signal.amount / signal.tripDistance > 200) {
            riskScore += 15;
            flags.push('Price-per-km ratio is abnormally high');
        }

        // Clamp score
        riskScore = Math.min(100, riskScore);

        let riskLevel: FraudAssessment['riskLevel'];
        let recommendation: FraudAssessment['recommendation'];

        if (riskScore >= 70) {
            riskLevel = 'CRITICAL';
            recommendation = 'BLOCK';
        } else if (riskScore >= 45) {
            riskLevel = 'HIGH';
            recommendation = 'REVIEW';
        } else if (riskScore >= 20) {
            riskLevel = 'MEDIUM';
            recommendation = 'REVIEW';
        } else {
            riskLevel = 'LOW';
            recommendation = 'APPROVE';
        }

        logger.info('Fraud assessment completed', {
            userId: signal.userId,
            riskLevel,
            riskScore,
        });

        return { riskLevel, riskScore, flags, recommendation };
    } catch (error: any) {
        logger.error('Fraud detection failed', { error: error.message, userId: signal.userId });
        // Fail-safe: flag for review rather than auto-approving
        return {
            riskLevel: 'MEDIUM',
            riskScore: 50,
            flags: ['Fraud detection system error — manual review required'],
            recommendation: 'REVIEW',
        };
    }
}
