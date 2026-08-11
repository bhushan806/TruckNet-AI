// ── Admin Audit Log Model ──
// Records sensitive admin actions for accountability.
// Stored in MongoDB — survives restarts (unlike traffic metrics).

import mongoose from 'mongoose';

const adminAuditSchema = new mongoose.Schema({
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    adminEmail: {
        type: String,
        required: true,
    },
    action: {
        type: String,
        required: true,
        enum: [
            'VIEW_AS_CUSTOMER',
            'VIEW_AS_DRIVER',
            'VIEW_AS_OWNER',
            'RETURN_TO_ADMIN',
            'ADMIN_AI_QUERY',
            'ADMIN_DASHBOARD_ACCESS',
            'ADMIN_USERS_VIEW',
            'ADMIN_ANALYTICS_VIEW',
        ],
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    // SECURITY: Never store passwords, tokens, or secrets here
}, { timestamps: true });

adminAuditSchema.index({ createdAt: -1 });
adminAuditSchema.index({ adminId: 1, createdAt: -1 });

export const AdminAuditModel = mongoose.model('AdminAudit', adminAuditSchema);
