import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
    owner: string; // Postgres UUID
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    date: Date;
    status: 'completed' | 'pending';
    relatedId?: string; // e.g., Load ID or Vehicle ID
}

const TransactionSchema: Schema = new Schema({
    owner: { type: String, required: true }, // Storing Postgres UUID
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    category: { type: String, default: 'General' },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['completed', 'pending'], default: 'completed' },
    relatedId: { type: String }
}, { timestamps: true });

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
