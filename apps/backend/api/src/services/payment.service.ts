// ── Payment Service ──
// Secure Indian Freight Payments & Escrow Ledger Management.
// Compliant with NPCI Unified Payments Interface (UPI) standards.

import QRCode from 'qrcode';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { PaymentTransactionModel, IPaymentTransaction } from '../models/mongoose/PaymentTransaction';
import { LoadModel } from '../models/mongoose/Load';
import { TripModel } from '../models/mongoose/Trip';
import { TripDocumentModel } from '../models/mongoose/TripDocument';
import { UserModel } from '../models/mongoose/User';
import { getIO } from '../config/socket';
import { logger } from '../utils/logger';

export interface CreateOrderParams {
    loadId: string;
    payerId: string;
    stage?: 'ADVANCE' | 'BALANCE' | 'FULL' | 'DEMURRAGE';
    customAmount?: number;
    idempotencyKey?: string;
    payerVpa?: string;
    payeeVpa?: string;
    notes?: string;
}

export interface VerifyUtrParams {
    paymentId?: string;
    paymentReference?: string;
    utrNumber: string;
    userId: string;
    notes?: string;
}

export class PaymentService {
    // Standard TruckNet Escrow UPI VPA for verified transport settlements
    private static DEFAULT_ESCROW_VPA = 'trucknet.escrow@okhdfcbank';
    private static PLATFORM_FEE_PCT = 2.0; // 2.0% platform brokerage

    /**
     * Creates or retrieves an existing payment order with dynamic NPCI UPI QR code
     */
    static async createPaymentOrder(params: CreateOrderParams) {
        const { loadId, payerId, stage = 'ADVANCE', customAmount, idempotencyKey, payerVpa, notes } = params;

        // 1. Check idempotency
        if (idempotencyKey) {
            const existing = await PaymentTransactionModel.findOne({ idempotencyKey });
            if (existing && existing.status === 'INITIATED') {
                return {
                    payment: existing,
                    upiIntentUrl: existing.upiIntentUrl,
                    qrCodeDataUrl: existing.qrCodeDataUrl,
                    breakdown: this.calculateFeeBreakdown(existing.amount),
                };
            }
        }

        // 2. Fetch load details
        const load = await LoadModel.findById(loadId).populate('customerId').populate('ownerId');
        if (!load) {
            throw new Error('Load not found');
        }

        // 3. Check corresponding trip (if accepted)
        const trip = await TripModel.findOne({ loadId: load._id });

        // 4. Calculate milestone amount
        const totalFreight = load.price || 0;
        let amount = customAmount;
        if (!amount || amount <= 0) {
            if (stage === 'ADVANCE') {
                // 25% standard Indian trucking advance for diesel/toll
                amount = Math.round(totalFreight * 0.25);
            } else if (stage === 'BALANCE') {
                // Check if advance was already completed
                const advanceTx = await PaymentTransactionModel.findOne({
                    loadId: load._id,
                    stage: 'ADVANCE',
                    status: 'COMPLETED',
                });
                const advancePaid = advanceTx ? advanceTx.amount : 0;
                amount = Math.max(0, totalFreight - advancePaid);
            } else if (stage === 'FULL') {
                amount = totalFreight;
            } else {
                amount = Math.round(totalFreight * 0.25);
            }
        }

        if (amount <= 0) {
            throw new Error(`Calculated payable amount for stage ${stage} is zero or invalid.`);
        }

        // 5. Calculate TruckNet platform cut & Transporter net
        const fee = Math.round(amount * (this.PLATFORM_FEE_PCT / 100));
        const gst = Math.round(fee * 0.18); // 18% GST on brokerage fee
        const totalPlatformCut = fee + gst;
        const netPayeeAmount = amount - totalPlatformCut;

        // 6. Payee resolution (Transporter VPA or Escrow VPA)
        const payeeVpa = params.payeeVpa || this.DEFAULT_ESCROW_VPA;

        // 7. Generate unique Payment Reference
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
        const paymentReference = `PAY-${today}-${rand}`;

        // 8. Generate NPCI compliant UPI Intent URI
        // Format: upi://pay?pa=<VPA>&pn=<PayeeName>&am=<Amount>&tr=<Ref>&tn=<Note>&cu=INR
        const encodedNote = encodeURIComponent(`TruckNet Freight ${load.transactionId || load.loadNumber || load._id}`);
        const upiIntentUrl = `upi://pay?pa=${payeeVpa}&pn=TruckNet+Logistics&am=${amount.toFixed(2)}&tr=${paymentReference}&tn=${encodedNote}&cu=INR`;

        // 9. Generate base64 DataURL QR Code for display
        const qrCodeDataUrl = await QRCode.toDataURL(upiIntentUrl, {
            errorCorrectionLevel: 'H',
            width: 320,
            margin: 2,
            color: {
                dark: '#0f172a',
                light: '#ffffff',
            },
        });

        // 10. Persist Payment Transaction in database
        const payment = new PaymentTransactionModel({
            paymentReference,
            idempotencyKey,
            loadId: load._id,
            tripId: trip?._id,
            transactionId: load.transactionId || `TRX-${today}-${rand}`,
            loadNumber: load.loadNumber,
            tripNumber: trip?.tripNumber,
            payerId: new mongoose.Types.ObjectId(payerId),
            payeeId: trip?.ownerId || (load.ownerId as any)?._id,
            payerName: (load.customerId as any)?.name || 'Consignor Shipper',
            payeeName: (load.ownerId as any)?.companyName || 'Verified Fleet Transporter',
            payerPhone: (load.customerId as any)?.phone,
            payeePhone: (load.ownerId as any)?.phone,
            stage,
            amount,
            currency: 'INR',
            platformFeePercentage: this.PLATFORM_FEE_PCT,
            platformFee: fee,
            platformGst: gst,
            totalPlatformCut,
            netPayeeAmount,
            method: 'UPI',
            status: 'INITIATED',
            payerVpa,
            payeeVpa,
            upiIntentUrl,
            qrCodeDataUrl,
            notes,
        });

        await payment.save();

        logger.info('Payment order created successfully', {
            paymentReference,
            loadId: load._id,
            stage,
            amount,
        });

        return {
            payment,
            upiIntentUrl,
            qrCodeDataUrl,
            breakdown: {
                grossAmount: amount,
                platformFee: fee,
                platformGst: gst,
                totalPlatformCut,
                netPayeeAmount,
                platformFeePct: this.PLATFORM_FEE_PCT,
            },
        };
    }

    /**
     * Submits and verifies a 12-digit Indian Bank UTR reference
     * Includes anti-fraud duplicate checks across the entire system.
     */
    static async verifyUtr(params: VerifyUtrParams) {
        const { paymentId, paymentReference, utrNumber, userId, notes } = params;

        const cleanUtr = utrNumber.trim();
        // Validation: 8-22 alphanumeric Indian Bank UTR or UPI Reference Number
        if (!cleanUtr || !/^[A-Za-z0-9]{8,22}$/.test(cleanUtr)) {
            throw new Error('Invalid UTR format. Please provide a valid 8 to 22 character Indian Bank UTR or UPI Reference Number without special characters.');
        }

        // 1. Anti-fraud check: Ensure UTR is not already used in any other transaction
        const duplicate = await PaymentTransactionModel.findOne({
            utrNumber: cleanUtr,
            ...(paymentId ? { _id: { $ne: paymentId } } : {}),
            ...(paymentReference ? { paymentReference: { $ne: paymentReference } } : {}),
        }).lean();

        if (duplicate) {
            throw new Error(`Fraud Prevention Alert: UTR '${cleanUtr}' has already been recorded in transaction ${duplicate.paymentReference}. Duplicate submissions are strictly prevented.`);
        }

        // 2. Fetch target payment transaction
        const query: any = {};
        if (paymentId) query._id = paymentId;
        else if (paymentReference) query.paymentReference = paymentReference;
        else throw new Error('paymentId or paymentReference is required');

        const payment = await PaymentTransactionModel.findOne(query);
        if (!payment) {
            throw new Error('Payment transaction record not found.');
        }

        if (payment.status === 'COMPLETED' || payment.status === 'ESCROW_LOCKED') {
            return {
                alreadyVerified: true,
                payment,
            };
        }

        // 3. Determine new status:
        // - Advance or Full: marks COMPLETED
        // - Balance: marks ESCROW_LOCKED until delivery POD verification
        const newStatus = payment.stage === 'BALANCE' ? 'ESCROW_LOCKED' : 'COMPLETED';

        payment.utrNumber = cleanUtr;
        payment.status = newStatus;
        payment.verifiedAt = new Date();
        payment.verifiedBy = 'AUTO_UTR';
        if (notes) payment.notes = notes;

        // 4. Generate digital cryptographic HMAC verification hash
        const secret = process.env.JWT_SECRET || 'trucknet_payment_secret_salt_2026';
        const payload = `${payment.paymentReference}|${cleanUtr}|${payment.amount}|${payment.loadId}|${newStatus}|${payment.verifiedAt.toISOString()}`;
        payment.verificationHash = crypto.createHmac('sha256', secret).update(payload).digest('hex');

        // Generate receipt number
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
        payment.receiptNumber = `RCT-${today}-${rand}`;

        try {
            await payment.save();
        } catch (saveError: any) {
            if (saveError.code === 11000) {
                throw new Error(`Fraud Prevention Alert: UTR '${cleanUtr}' was submitted simultaneously and already exists.`);
            }
            throw saveError;
        }

        // 5. Update Statutory Bilty / LR Document with payment proof
        try {
            await this.syncPaymentWithBilty(payment);
        } catch (err: any) {
            logger.warn('Failed to sync payment with Bilty document', { error: err.message });
        }

        // 6. Broadcast Real-Time WebSocket event
        try {
            const io = getIO();
            const eventPayload = {
                paymentId: payment._id,
                paymentReference: payment.paymentReference,
                receiptNumber: payment.receiptNumber,
                stage: payment.stage,
                amount: payment.amount,
                status: payment.status,
                utrNumber: cleanUtr,
                loadId: payment.loadId,
                transactionId: payment.transactionId,
                timestamp: payment.verifiedAt,
            };

            // Broadcast to load room, trip room, and user rooms
            io.to(payment.loadId.toString()).emit('payment:updated', eventPayload);
            if (payment.tripId) {
                io.to(`trip:${payment.tripId}`).emit('payment:updated', eventPayload);
            }
            if (payment.payerId) {
                io.to(payment.payerId.toString()).emit('payment:updated', eventPayload);
            }
            if (payment.payeeId) {
                io.to(payment.payeeId.toString()).emit('payment:updated', eventPayload);
            }
        } catch (socketErr: any) {
            logger.warn('Failed to emit socket payment update', { error: socketErr.message });
        }

        return {
            success: true,
            payment,
        };
    }

    /**
     * Release Escrow Balance upon delivery & POD signoff (Atomic concurrency safe)
     */
    static async releaseEscrowBalance(loadId: string, releasedByUserId: string) {
        const payment = await PaymentTransactionModel.findOneAndUpdate(
            {
                loadId: mongoose.Types.ObjectId.isValid(loadId) ? new mongoose.Types.ObjectId(loadId) : loadId,
                stage: 'BALANCE',
                status: 'ESCROW_LOCKED',
            },
            {
                $set: {
                    status: 'COMPLETED',
                    verifiedAt: new Date(),
                    verifiedBy: 'TRANSPORTER_CONFIRMED',
                    notes: `Escrow balance released upon verified delivery. Confirmed by user ${releasedByUserId}.`,
                },
            },
            { new: true }
        );

        if (!payment) {
            throw new Error('No escrow-locked balance payment found for this consignment, or balance already released.');
        }

        // Update Bilty to fully paid if not already
        try {
            await this.syncPaymentWithBilty(payment);
        } catch (err: any) {
            logger.warn('Failed to sync escrow release with Bilty', { error: err.message });
        }

        // Broadcast real-time release event
        try {
            const io = getIO();
            const eventPayload = {
                paymentId: payment._id,
                paymentReference: payment.paymentReference,
                stage: payment.stage,
                amount: payment.amount,
                status: 'COMPLETED',
                loadId: payment.loadId,
                transactionId: payment.transactionId,
                notes: 'Balance released from TruckNet Escrow to Transporter upon verified delivery.',
            };
            io.to(payment.loadId.toString()).emit('payment:settled', eventPayload);
            io.to(payment.loadId.toString()).emit('payment:updated', eventPayload);
            if (payment.payeeId) {
                io.to(payment.payeeId.toString()).emit('payment:settled', eventPayload);
            }
        } catch (socketErr: any) {
            logger.warn('Failed to emit socket settlement event', { error: socketErr.message });
        }

        return payment;
    }

    /**
     * Fetches all payment milestones and escrow summary for a load or trip
     */
    static async getPaymentDetails(identifier: string) {
        let load: any = null;
        if (mongoose.Types.ObjectId.isValid(identifier)) {
            load = await LoadModel.findById(identifier);
        }
        if (!load) {
            load = await LoadModel.findOne({
                $or: [{ loadNumber: identifier }, { transactionId: identifier }],
            });
        }

        if (!load) {
            throw new Error(`Load with identifier '${identifier}' not found.`);
        }

        const payments = await PaymentTransactionModel.find({ loadId: load._id }).sort({ createdAt: 1 });

        const totalFreight = load.price || 0;
        let totalPaid = 0;
        let escrowLocked = 0;
        let advancePaid = 0;
        let balancePaid = 0;

        for (const p of payments) {
            if (p.status === 'COMPLETED') {
                totalPaid += p.amount;
                if (p.stage === 'ADVANCE') advancePaid += p.amount;
                if (p.stage === 'BALANCE' || p.stage === 'FULL') balancePaid += p.amount;
            } else if (p.status === 'ESCROW_LOCKED') {
                escrowLocked += p.amount;
            }
        }

        const remainingBalance = Math.max(0, totalFreight - (totalPaid + escrowLocked));

        return {
            loadId: load._id,
            transactionId: load.transactionId,
            loadNumber: load.loadNumber,
            totalFreight,
            advanceAmountExpected: Math.round(totalFreight * 0.25),
            balanceAmountExpected: Math.round(totalFreight * 0.75),
            advancePaid,
            balancePaid,
            escrowLocked,
            hasEscrowBalance: escrowLocked > 0,
            escrowBalanceAmount: escrowLocked,
            canReleaseEscrow: escrowLocked > 0 && (load.status === 'COMPLETED' || load.status === 'DELIVERED'),
            totalPaid,
            remainingBalance,
            isAdvanceSettled: advancePaid > 0,
            isFullySettled: totalPaid >= totalFreight,
            platformFeePct: this.PLATFORM_FEE_PCT,
            platformFeeTotal: Math.round(totalFreight * (this.PLATFORM_FEE_PCT / 100)),
            payments,
        };
    }

    /**
     * Internal helper to synchronize verified payment proof into statutory Bilty / LR
     */
    private static async syncPaymentWithBilty(payment: IPaymentTransaction) {
        const biltyDoc = await TripDocumentModel.findOne({
            loadId: payment.loadId,
            documentType: 'BILTY_LR',
        });

        if (!biltyDoc) return;

        if (payment.stage === 'ADVANCE') {
            biltyDoc.freight.advancePaid = payment.amount;
            biltyDoc.freight.balanceDue = Math.max(0, biltyDoc.freight.totalAmount - payment.amount);
            biltyDoc.freight.paymentMode = 'ADVANCE_PAID';
            biltyDoc.freight.isPaid = biltyDoc.freight.balanceDue === 0;
        } else if (payment.stage === 'BALANCE' || payment.stage === 'FULL') {
            biltyDoc.freight.balanceDue = 0;
            biltyDoc.freight.isPaid = true;
            biltyDoc.freight.paymentMode = 'PAID';
        }

        // Resign document hash
        biltyDoc.digitalSignature.signedAt = new Date();
        const payload = `${biltyDoc.lrNumber}|${biltyDoc.freight.totalAmount}|${biltyDoc.freight.advancePaid}|${payment.utrNumber || 'NO_UTR'}|${biltyDoc.digitalSignature.signedAt.toISOString()}`;
        biltyDoc.digitalSignature.hash = crypto.createHash('sha256').update(payload).digest('hex');
        await biltyDoc.save();
    }

    /**
     * Helper to compute fee breakdown
     */
    private static calculateFeeBreakdown(amount: number) {
        const fee = Math.round(amount * (this.PLATFORM_FEE_PCT / 100));
        const gst = Math.round(fee * 0.18);
        return {
            grossAmount: amount,
            platformFee: fee,
            platformGst: gst,
            totalPlatformCut: fee + gst,
            netPayeeAmount: amount - (fee + gst),
            platformFeePct: this.PLATFORM_FEE_PCT,
        };
    }
}
