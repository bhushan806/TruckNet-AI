import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
    action?: string;
    data?: any;
    structuredData?: {
        pricing?: any;
        risk?: any;
        loadSharing?: any;
        insights?: any;
        routeAdvanced?: any;
    };
    timestamp: Date;
}

export interface IChat extends Document {
    userId: string;
    role: 'CUSTOMER' | 'DRIVER' | 'OWNER' | 'ADMIN';
    messages: IMessage[];
    createdAt: Date;
    updatedAt: Date;
}

const MessageSchema: Schema = new Schema({
    role: {
        type: String,
        enum: ['system', 'user', 'assistant'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required: false
    },
    data: {
        type: Schema.Types.Mixed,
        required: false
    },
    structuredData: {
        type: Schema.Types.Mixed,
        required: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const ChatSchema: Schema = new Schema(
    {
        userId: {
            type: String,
            required: true,
            index: true
        },
        role: {
            type: String,
            enum: ['CUSTOMER', 'DRIVER', 'OWNER', 'ADMIN'],
            required: true
        },
        messages: [MessageSchema]
    },
    {
        timestamps: true
    }
);

// We want to ensure each user only has one active chat thread in this simple model,
// or we just find the latest one. Let's make it one chat document per user.
ChatSchema.index({ userId: 1 }, { unique: true });

export const ChatModel = mongoose.model<IChat>('Chat', ChatSchema);
