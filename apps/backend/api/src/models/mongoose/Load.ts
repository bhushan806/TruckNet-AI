import mongoose from 'mongoose';

// ── Audit sub-schema ──
const auditEntrySchema = new mongoose.Schema({
    action: { type: String, required: true },
    fromStatus: { type: String },
    toStatus: { type: String },
    userId: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    meta: { type: mongoose.Schema.Types.Mixed },
}, { _id: false });

// ── Load schema ──
const loadSchema = new mongoose.Schema({
    loadNumber: { type: String, unique: true, sparse: true, index: true },
    transactionId: { type: String, unique: true, sparse: true, index: true },
    source: { type: String, required: true },
    destination: { type: String, required: true },
    sourceCity: { type: String, trim: true },
    destinationCity: { type: String, trim: true },
    weight: { type: Number, required: true },
    goodsType: { type: String, required: true },
    requiredBodyType: {
        type: String,
        enum: ['CEMENT_BULKER', 'FLATBED', 'OPEN_HIGH_BED', 'CONTAINER_CLOSED', 'TANKER_LIQUID', 'TIPPER_DUMPER', 'ANY'],
        default: 'ANY'
    },
    price: { type: Number, required: true },
    distance: { type: Number },
    vehicleType: { type: String, default: 'Truck' },
    description: { type: String },
    status: {
        type: String,
        enum: ['OPEN', 'ACCEPTED_BY_OWNER', 'ASSIGNED_TO_DRIVER', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'],
        default: 'OPEN',
        index: true,
    },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'OwnerProfile', index: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'DriverProfile', index: true },
    pickupLat: { type: Number },
    pickupLng: { type: Number },
    dropLat: { type: Number },
    dropLng: { type: Number },
    acceptedAt: { type: Date },
    assignedAt: { type: Date },
    completedAt: { type: Date },
    // Soft delete
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    // Audit trail
    auditTrail: [auditEntrySchema],
}, {
    timestamps: true,
    // Optimistic concurrency — Mongoose uses __v for version checks
    optimisticConcurrency: true,
});

// ── Auto-generate human-readable Load Number and Transaction ID ──
loadSchema.pre('save', function (this: any) {
    if (!this.loadNumber) {
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const rand = Math.floor(1000 + Math.random() * 9000);
        this.loadNumber = `LOD-${today}-${rand}`;
    }
    if (!this.transactionId) {
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
        this.transactionId = `TRX-${today}-${rand}`;
    }
});

// ── Compound indexes ──
loadSchema.index({ status: 1, createdAt: -1 });
loadSchema.index({ ownerId: 1, status: 1 });
loadSchema.index({ driverId: 1, status: 1 });
loadSchema.index({ customerId: 1, createdAt: -1 });
loadSchema.index({ status: 1, acceptedAt: 1 }); // for expiration queries

// ── Default filter: exclude soft-deleted ──
loadSchema.pre('find', function () {
    if (!(this as any)._conditions.isDeleted) {
        this.where({ isDeleted: { $ne: true } });
    }
});
loadSchema.pre('findOne', function () {
    if (!(this as any)._conditions.isDeleted) {
        this.where({ isDeleted: { $ne: true } });
    }
});
loadSchema.pre('countDocuments', function () {
    if (!(this as any)._conditions.isDeleted) {
        this.where({ isDeleted: { $ne: true } });
    }
});

// ── Valid transitions map ──
export const VALID_TRANSITIONS: Record<string, string[]> = {
    'OPEN': ['ACCEPTED_BY_OWNER', 'CANCELLED'],
    'ACCEPTED_BY_OWNER': ['ASSIGNED_TO_DRIVER'],
    'ASSIGNED_TO_DRIVER': ['IN_TRANSIT'],
    'IN_TRANSIT': ['COMPLETED'],
    'COMPLETED': [],
    'CANCELLED': [],
};

export function isValidTransition(from: string, to: string): boolean {
    return (VALID_TRANSITIONS[from] || []).includes(to);
}

export const LoadModel = mongoose.model('Load', loadSchema);
