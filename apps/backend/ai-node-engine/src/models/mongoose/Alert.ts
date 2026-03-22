// ── MongoDB Model: Alert ──
// Stores predictive intelligence alerts for shipments.
// Used by alertEngine.service.ts for persistence.

import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
    alertId: { type: String, required: true, unique: true, index: true },
    shipmentId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    type: {
        type: String,
        enum: ['RISK_HIGH', 'REROUTE_SUGGESTED', 'DELAY_CRITICAL', 'NETWORK_CONGESTION'],
        required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    actionRequired: { type: Boolean, default: false },
    suggestedAction: { type: String, default: '' },
    read: { type: Boolean, default: false, index: true },
    acknowledged: { type: Boolean, default: false },
    escalated: { type: Boolean, default: false },
    escalationCount: { type: Number, default: 0 },
}, {
    timestamps: true,
});

// Compound indexes for common queries
alertSchema.index({ userId: 1, read: 1, createdAt: -1 });
alertSchema.index({ shipmentId: 1, type: 1 });
alertSchema.index({ acknowledged: 1, escalated: 1 }); // for escalation queries

// Safe model export (prevents OverwriteModelError on HMR)
export const AlertModel = mongoose.models.Alert || mongoose.model('Alert', alertSchema);
