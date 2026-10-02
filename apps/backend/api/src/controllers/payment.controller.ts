// ── Payment Controller ──
// Handles HTTP endpoints for Indian transportation payment milestones.

import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/payment.service';
import { AppError } from '../utils/AppError';

export class PaymentController {
    /**
     * POST /api/payments/order
     * Generates a dynamic NPCI UPI payment QR & intent
     */
    static async createOrder(req: Request, res: Response, next: NextFunction) {
        try {
            const { loadId, stage, customAmount, idempotencyKey, payerVpa, payeeVpa, notes } = req.body;
            const payerId = (req as any).user?.id || (req as any).user?._id;

            if (!loadId) {
                return next(new AppError('loadId is required', 400));
            }
            if (!payerId) {
                return next(new AppError('Authentication required to create a payment order', 401));
            }

            const result = await PaymentService.createPaymentOrder({
                loadId,
                payerId,
                stage,
                customAmount: customAmount ? Number(customAmount) : undefined,
                idempotencyKey,
                payerVpa,
                payeeVpa,
                notes,
            });

            res.status(201).json({
                status: 'success',
                message: 'Payment order created with dynamic UPI QR code.',
                data: result,
            });
        } catch (error: any) {
            next(new AppError(error.message || 'Failed to create payment order', 400));
        }
    }

    /**
     * POST /api/payments/verify-utr
     * Submits 12-digit UTR with anti-fraud duplicate detection
     */
    static async verifyUtr(req: Request, res: Response, next: NextFunction) {
        try {
            const { paymentId, paymentReference, utrNumber, notes } = req.body;
            const userId = (req as any).user?.id || (req as any).user?._id;

            if (!utrNumber) {
                return next(new AppError('utrNumber is required for payment verification', 400));
            }
            if (!paymentId && !paymentReference) {
                return next(new AppError('paymentId or paymentReference is required', 400));
            }

            const result = await PaymentService.verifyUtr({
                paymentId,
                paymentReference,
                utrNumber,
                userId,
                notes,
            });

            res.status(200).json({
                status: 'success',
                message: 'Payment verified and recorded successfully.',
                data: result,
            });
        } catch (error: any) {
            next(new AppError(error.message || 'Failed to verify UTR payment', 400));
        }
    }

    /**
     * POST /api/payments/release-escrow
     * Releases escrow-held balance to the transporter upon delivery
     */
    static async releaseEscrow(req: Request, res: Response, next: NextFunction) {
        try {
            const { loadId } = req.body;
            const userId = (req as any).user?.id || (req as any).user?._id;

            if (!loadId) {
                return next(new AppError('loadId is required to release escrow', 400));
            }

            const result = await PaymentService.releaseEscrowBalance(loadId, userId);

            res.status(200).json({
                status: 'success',
                message: 'Escrow balance released to transporter successfully.',
                data: result,
            });
        } catch (error: any) {
            next(new AppError(error.message || 'Failed to release escrow', 400));
        }
    }

    /**
     * GET /api/payments/by-load/:identifier
     * Fetches all milestone payments & escrow summary
     */
    static async getPaymentDetails(req: Request, res: Response, next: NextFunction) {
        try {
            const { identifier } = req.params;
            const result = await PaymentService.getPaymentDetails(identifier);

            res.status(200).json({
                status: 'success',
                data: result,
            });
        } catch (error: any) {
            next(new AppError(error.message || 'Failed to fetch payment details', 404));
        }
    }
}
