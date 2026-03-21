import mongoose, { Schema, Document } from 'mongoose';

export interface IDocument extends Document {
    owner: string; // Postgres UUID
    title: string;
    type: 'Vehicle' | 'Driver' | 'Load';
    entityId?: string; // Vehicle ID or Driver ID
    url: string;
    expiryDate?: Date;
    status: 'valid' | 'expiring' | 'expired';
}

const DocumentSchema: Schema = new Schema({
    owner: { type: String, required: true }, // Storing Postgres UUID
    title: { type: String, required: true },
    type: { type: String, enum: ['Vehicle', 'Driver', 'Load'], required: true },
    entityId: { type: String },
    url: { type: String, required: true },
    expiryDate: { type: Date },
    status: { type: String, enum: ['valid', 'expiring', 'expired'], default: 'valid' }
}, { timestamps: true });

export default mongoose.model<IDocument>('Document', DocumentSchema);
