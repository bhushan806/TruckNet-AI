import mongoose, { Schema, Document } from 'mongoose';

export interface IConnectionRequest extends Document {
    ownerId: mongoose.Types.ObjectId;
    driverId: mongoose.Types.ObjectId;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    message?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ConnectionRequestSchema: Schema = new Schema({
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    driverId: { type: Schema.Types.ObjectId, ref: 'DriverProfile', required: true },
    status: { type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED'], default: 'PENDING' },
    message: { type: String },
}, { timestamps: true });

// Ensure unique pending request between owner and driver
ConnectionRequestSchema.index({ ownerId: 1, driverId: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'PENDING' } });

export const ConnectionRequestModel = mongoose.model<IConnectionRequest>('ConnectionRequest', ConnectionRequestSchema);
