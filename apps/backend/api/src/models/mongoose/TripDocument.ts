// ── Trip Document Model ──
// Statutory Indian Transportation Documents (Bilty / Lorry Receipt, Transit Slip, POD, Freight Invoice)
// Compliant with Carriage by Road Act 2007 and GST Goods Transport Agency (GTA) rules.

import mongoose from 'mongoose';

export interface ITripDocument extends mongoose.Document {
    tripId: mongoose.Types.ObjectId;
    loadId: mongoose.Types.ObjectId;
    transactionId: string;
    tripNumber: string;
    loadNumber: string;
    lrNumber: string;
    documentType: 'BILTY_LR' | 'EWAY_SLIP' | 'POD' | 'FREIGHT_BILL';
    title: string;
    consignor: {
        name: string;
        phone: string;
        email?: string;
        address: string;
        city: string;
        gstin?: string;
    };
    consignee: {
        name: string;
        phone: string;
        address: string;
        city: string;
        gstin?: string;
    };
    transporter: {
        name: string;
        companyName: string;
        phone: string;
        gstin?: string;
        address?: string;
    };
    vehicle: {
        number: string;
        type: string;
        bodyType: string;
        rcNumber?: string;
        capacity: number;
    };
    driver: {
        name: string;
        phone: string;
        licenseNumber?: string;
    };
    goods: {
        type: string;
        weight: number;
        hsnCode: string;
        packagingType: string;
        declaredValue: number;
    };
    freight: {
        totalAmount: number;
        paymentMode: 'PAID' | 'TO_PAY' | 'TO_BE_BILLED' | 'ADVANCE_PAID';
        advancePaid: number;
        balanceDue: number;
        isPaid: boolean;
        rcmApplicable: boolean;
        gstExemptionNote: string;
    };
    legalClauses: string[];
    digitalSignature: {
        hash: string;
        signedAt: Date;
        signer: string;
        verificationUrl: string;
    };
    status: 'ACTIVE' | 'DELIVERED' | 'ARCHIVED';
    createdAt: Date;
    updatedAt: Date;
}

const tripDocumentSchema = new mongoose.Schema({
    tripId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Trip',
        required: true,
        index: true,
    },
    loadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Load',
        required: true,
        index: true,
    },
    transactionId: {
        type: String,
        required: true,
        index: true,
    },
    tripNumber: {
        type: String,
        required: true,
        index: true,
    },
    loadNumber: {
        type: String,
        required: true,
        index: true,
    },
    lrNumber: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    documentType: {
        type: String,
        enum: ['BILTY_LR', 'EWAY_SLIP', 'POD', 'FREIGHT_BILL'],
        default: 'BILTY_LR',
    },
    title: {
        type: String,
        required: true,
    },
    consignor: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        email: { type: String },
        address: { type: String, required: true },
        city: { type: String, required: true },
        gstin: { type: String, default: 'URP (Unregistered Person)' },
    },
    consignee: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        gstin: { type: String, default: 'URP (Unregistered Person)' },
    },
    transporter: {
        name: { type: String, required: true },
        companyName: { type: String, required: true },
        phone: { type: String, required: true },
        gstin: { type: String, default: '27AABCT9982Q1Z4' },
        address: { type: String, default: 'Central Logistics Hub, Transport Nagar' },
    },
    vehicle: {
        number: { type: String, required: true },
        type: { type: String, required: true },
        bodyType: { type: String, required: true },
        rcNumber: { type: String },
        capacity: { type: Number, required: true },
    },
    driver: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        licenseNumber: { type: String, default: 'DL-MH-20210089211' },
    },
    goods: {
        type: { type: String, required: true },
        weight: { type: Number, required: true },
        hsnCode: { type: String, required: true },
        packagingType: { type: String, required: true },
        declaredValue: { type: Number, required: true },
    },
    freight: {
        totalAmount: { type: Number, required: true },
        paymentMode: {
            type: String,
            enum: ['PAID', 'TO_PAY', 'TO_BE_BILLED', 'ADVANCE_PAID'],
            default: 'TO_PAY',
        },
        advancePaid: { type: Number, default: 0 },
        balanceDue: { type: Number, required: true },
        isPaid: { type: Boolean, default: false },
        rcmApplicable: { type: Boolean, default: true },
        gstExemptionNote: { type: String },
    },
    legalClauses: [{ type: String }],
    digitalSignature: {
        hash: { type: String, required: true },
        signedAt: { type: Date, default: Date.now },
        signer: { type: String, default: 'TruckNet Automated Trust Engine' },
        verificationUrl: { type: String },
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'DELIVERED', 'ARCHIVED'],
        default: 'ACTIVE',
    },
}, {
    timestamps: true,
});

tripDocumentSchema.index({ tripId: 1, documentType: 1 });
tripDocumentSchema.index({ loadId: 1, documentType: 1 });

export const TripDocumentModel = mongoose.model<ITripDocument>('TripDocument', tripDocumentSchema);
