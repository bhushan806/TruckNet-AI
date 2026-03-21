import mongoose from 'mongoose';

const ownerProfileSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    companyName: { type: String }
});

export const OwnerProfileModel = mongoose.model('OwnerProfile', ownerProfileSchema);
