import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['CUSTOMER', 'DRIVER', 'OWNER', 'ADMIN'], default: 'CUSTOMER' },
    isVerified: { type: Boolean, default: false },
    avatar: { type: String },
}, { timestamps: true });

export const UserModel = mongoose.model('User', userSchema);
