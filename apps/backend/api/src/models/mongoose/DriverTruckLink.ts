// ── DriverTruckLink Model ──
// Tracks driver invitations/assignments to specific trucks.
// Supports the per-truck owner-operator vs fleet-driver pattern.
//
// Flow:
//   1. Owner invites driver by phone → status: 'invited'
//   2. Driver confirms via OTP → status: 'confirmed', Vehicle.assignedDriverId set
//   3. Owner can remove driver → status: 'removed' (history preserved, not deleted)
//
// Constraints:
//   - Only one active (invited/confirmed) link per truck
//   - Only one active link per driver (a driver can only be assigned to one truck at a time)
//   - Removed links are preserved for audit history

import mongoose from 'mongoose';

export const LINK_STATUSES = ['invited', 'confirmed', 'removed'] as const;
export type LinkStatus = typeof LINK_STATUSES[number];

const driverTruckLinkSchema = new mongoose.Schema({
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    truckId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: true,
        index: true,
    },
    status: {
        type: String,
        enum: LINK_STATUSES,
        default: 'invited',
        index: true,
    },
    invitedAt: { type: Date, default: Date.now },
    confirmedAt: { type: Date },
    removedAt: { type: Date },
}, { timestamps: true });

// Only one active (non-removed) link per truck
driverTruckLinkSchema.index(
    { truckId: 1, status: 1 },
    {
        unique: true,
        partialFilterExpression: { status: { $in: ['invited', 'confirmed'] } },
    }
);

// Only one active link per driver (driver can only drive one truck at a time)
driverTruckLinkSchema.index(
    { driverId: 1, status: 1 },
    {
        unique: true,
        partialFilterExpression: { status: { $in: ['invited', 'confirmed'] } },
    }
);

export const DriverTruckLinkModel = mongoose.model('DriverTruckLink', driverTruckLinkSchema);
