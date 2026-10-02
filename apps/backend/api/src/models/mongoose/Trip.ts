// ── Trip Model ──
// Represents the execution of transporting a Load.
// Created when an owner accepts a match.
// Has its own lifecycle separate from the Load model.
//
// Key design decisions:
//   - ownerId: User who accepted the match (billed commission)
//   - driverId: User who executes checkpoints. Pulled from Vehicle.assignedDriverId
//     at accept-time. If null, ownerId is copied here (owner-operator).
//     This field is NEVER null on a Trip document.
//   - checkpoints[]: one-time geolocation reads at each status transition
//   - 1:1 with Load (enforced by unique index on loadId)

import mongoose from 'mongoose';

// ── Checkpoint sub-schema (geolocation at each status transition) ──
const checkpointSchema = new mongoose.Schema({
    status: { type: String, required: true },   // Trip status at checkpoint time
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
}, { _id: false });

// ── Trip status enum ──
export const TRIP_STATUSES = [
    'posted',
    'matched',
    'accepted',
    'pickup_confirmed',
    'in_transit',
    'delivered',
    'completed',
] as const;

export type TripStatus = typeof TRIP_STATUSES[number];

// ── Valid status transitions (no skipping) ──
export const TRIP_TRANSITIONS: Record<string, string[]> = {
    'posted': ['matched'],
    'matched': ['accepted'],
    'accepted': ['pickup_confirmed'],
    'pickup_confirmed': ['in_transit'],
    'in_transit': ['delivered'],
    'delivered': ['completed'],
    'completed': [],
};

export function isValidTripTransition(from: string, to: string): boolean {
    return (TRIP_TRANSITIONS[from] || []).includes(to);
}

// ── Trip schema ──
const tripSchema = new mongoose.Schema({
    tripNumber: {
        type: String,
        unique: true,
        sparse: true,
        index: true,
    },
    transactionId: {
        type: String,
        index: true,
    },
    loadNumber: {
        type: String,
        index: true,
    },
    loadId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Load',
        required: true,
    },
    vehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true,
    },

    // Who accepted the match (billed commission later)
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },

    // Who executes checkpoints — pulled from Vehicle.assignedDriverId at accept-time.
    // If Vehicle.assignedDriverId was null, ownerId is copied here (owner-operator).
    // This field is NEVER null on a Trip document.
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },

    status: {
        type: String,
        enum: TRIP_STATUSES,
        default: 'accepted',   // Trips are created at accept-time
        index: true,
    },

    checkpoints: [checkpointSchema],

    // ── Lifecycle timestamps ──
    acceptedAt: { type: Date },
    pickupConfirmedAt: { type: Date },
    inTransitAt: { type: Date },
    deliveredAt: { type: Date },
    completedAt: { type: Date },
}, { timestamps: true });

// ── Auto-generate human-readable Trip Number ──
tripSchema.pre('save', function (this: any) {
    if (!this.tripNumber) {
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const rand = Math.floor(1000 + Math.random() * 9000);
        this.tripNumber = `TRP-${today}-${rand}`;
    }
});

// ── Indexes ──
tripSchema.index({ ownerId: 1, status: 1 });
tripSchema.index({ driverId: 1, status: 1 });
tripSchema.index({ loadId: 1 }, { unique: true });  // 1 trip per load

export const TripModel = mongoose.model('Trip', tripSchema);
