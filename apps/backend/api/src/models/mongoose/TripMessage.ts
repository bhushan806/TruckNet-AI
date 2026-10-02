import mongoose from 'mongoose';

export interface ITripMessage extends mongoose.Document {
    tripId: mongoose.Types.ObjectId;
    loadId: mongoose.Types.ObjectId;
    transactionId: string;
    senderId: mongoose.Types.ObjectId;
    senderRole: 'CUSTOMER' | 'OWNER' | 'DRIVER' | 'ADMIN';
    senderName: string;
    content: string;
    messageType: 'TEXT' | 'QUICK_STATUS' | 'ALERT';
    createdAt: Date;
    updatedAt: Date;
}

const tripMessageSchema = new mongoose.Schema({
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
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    senderRole: {
        type: String,
        enum: ['CUSTOMER', 'OWNER', 'DRIVER', 'ADMIN'],
        required: true,
    },
    senderName: {
        type: String,
        required: true,
        trim: true,
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000,
    },
    messageType: {
        type: String,
        enum: ['TEXT', 'QUICK_STATUS', 'ALERT'],
        default: 'TEXT',
    },
}, {
    timestamps: true,
});

tripMessageSchema.index({ tripId: 1, createdAt: 1 });
tripMessageSchema.index({ transactionId: 1, createdAt: 1 });

export const TripMessageModel = mongoose.model<ITripMessage>('TripMessage', tripMessageSchema);
