// ── Payment Transaction Model ──
// High-security financial transaction ledger for Indian transportation.
// Features:
//   - Idempotency & double-payment prevention
//   - Unique sparse UTR indexing (no duplicate UTR reuse across the entire platform)
//   - Automatic TruckNet 2% platform commission deduction
//   - Multi-stage Escrow: Advance (25%) -> Escrow Locked Balance (75%) -> Released upon POD
//   - SHA-256 cryptographic verification seal

import mongoose from 'mongoose';
import crypto from 'crypto';

export interface IPaymentTransaction extends mongoose.Document {
    paymentReference: string;
    idempotencyKey?: string;
    loadId: mongoose.Types.ObjectId;
    tripId?: mongoose.Types.ObjectId;
    transactionId: string;
    loadNumber?: string;
    tripNumber?: string;
    payerId: mongoose.Types.ObjectId;
    payeeId?: mongoose.Types.ObjectId;
    payerName?: string;
    payeeName?: string;
    payerPhone?: string;
    payeePhone?: string;
    stage: 'ADVANCE' | 'BALANCE' | 'FULL' | 'DEMURRAGE';
    amount: number;
    currency: string;
    platformFeePercentage: number;
    platformFee: number;
    platformGst: number;
    totalPlatformCut: number;
    netPayeeAmount: number;
    method: 'UPI' | 'NETBANKING' | 'CARD' | 'WALLET' | 'CASH_DIRECT';
    status: 'INITIATED' | 'ESCROW_LOCKED' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'DISPUTED';
    utrNumber?: string;
    payerVpa?: string;
    payeeVpa?: string;
    upiIntentUrl?: string;
    qrCodeDataUrl?: string;
    verificationHash?: string;
    verifiedAt?: Date;
    verifiedBy?: 'AUTO_UTR' | 'ADMIN' | 'TRANSPORTER_CONFIRMED';
    receiptNumber?: string;
    notes?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

const paymentTransactionSchema = new mongoose.Schema({
    paymentReference: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    idempotencyKey: {
        type: String,
        unique: true,
        sparse: true,
        index: true,
    },
    loadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Load',
        required: true,
        index: true,
    },
    tripId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trip',
        index: true,
    },
    transactionId: {
        type: String,
        required: true,
        index: true,
    },
    loadNumber: {
        type: String,
        index: true,
    },
    tripNumber: {
        type: String,
        index: true,
    },
    payerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    payeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
    },
    payerName: { type: String },
    payeeName: { type: String },
    payerPhone: { type: String },
    payeePhone: { type: String },
    stage: {
        type: String,
        enum: ['ADVANCE', 'BALANCE', 'FULL', 'DEMURRAGE'],
        default: 'ADVANCE',
        index: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 1,
    },
    currency: {
        type: String,
        default: 'INR',
    },
    platformFeePercentage: {
        type: Number,
        default: 2.0, // Standard 2% platform commission
    },
    platformFee: {
        type: Number,
        default: 0,
    },
    platformGst: {
        type: Number,
        default: 0, // 18% GST on platform commission
    },
    totalPlatformCut: {
        type: Number,
        default: 0,
    },
    netPayeeAmount: {
        type: Number,
        default: 0,
    },
    method: {
        type: String,
        enum: ['UPI', 'NETBANKING', 'CARD', 'WALLET', 'CASH_DIRECT'],
        default: 'UPI',
    },
    status: {
        type: String,
        enum: ['INITIATED', 'ESCROW_LOCKED', 'COMPLETED', 'FAILED', 'REFUNDED', 'DISPUTED'],
        default: 'INITIATED',
        index: true,
    },
    utrNumber: {
        type: String,
        unique: true,
        sparse: true,
        index: true,
        trim: true,
    },
    payerVpa: { type: String, trim: true },
    payeeVpa: { type: String, trim: true },
    upiIntentUrl: { type: String },
    qrCodeDataUrl: { type: String },
    verificationHash: { type: String },
    verifiedAt: { type: Date },
    verifiedBy: {
        type: String,
        enum: ['AUTO_UTR', 'ADMIN', 'TRANSPORTER_CONFIRMED'],
    },
    receiptNumber: {
        type: String,
        unique: true,
        sparse: true,
        index: true,
    },
    notes: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
}, {
    timestamps: true,
});

// ── Auto-generate paymentReference and receiptNumber ──
paymentTransactionSchema.pre('save', function (this: any) {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    if (!this.paymentReference) {
        const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
        this.paymentReference = `PAY-${today}-${rand}`;
    }
    if (this.status === 'COMPLETED' && !this.receiptNumber) {
        const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
        this.receiptNumber = `RCT-${today}-${rand}`;
    }

    // Auto-calculate fee split if not yet assigned
    if (this.amount && this.platformFee === 0) {
        const fee = Math.round(this.amount * (this.platformFeePercentage / 100));
        const gst = Math.round(fee * 0.18);
        this.platformFee = fee;
        this.platformGst = gst;
        this.totalPlatformCut = fee + gst;
        this.netPayeeAmount = this.amount - (fee + gst);
    }
});

// ── Cryptographic helper to seal verification ──
paymentTransactionSchema.methods.generateVerificationHash = function (): string {
    const secret = process.env.JWT_SECRET || 'trucknet_payment_secret_salt_2026';
    const payload = `${this.paymentReference}|${this.utrNumber || 'NO_UTR'}|${this.amount}|${this.loadId}|${this.status}|${this.verifiedAt?.toISOString() || ''}`;
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
};

// ── Compound indexes for rapid queries ──
paymentTransactionSchema.index({ loadId: 1, stage: 1 });
paymentTransactionSchema.index({ transactionId: 1, status: 1 });
paymentTransactionSchema.index({ payerId: 1, createdAt: -1 });
paymentTransactionSchema.index({ payeeId: 1, createdAt: -1 });

export const PaymentTransactionModel = mongoose.model<IPaymentTransaction>('PaymentTransaction', paymentTransactionSchema);
