import mongoose from 'mongoose';

const driverProfileSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    licenseNumber: { type: String, required: true, unique: true },
    experienceYears: { type: Number, required: true },
    isAvailable: { type: Boolean, default: true },
    bio: { type: String },
    routes: [{ type: String }],
    currentLat: { type: Number },
    currentLng: { type: Number },
    rating: { type: Number, default: 5.0 },
    totalTrips: { type: Number, default: 0 },
    documents: [{
        type: { type: String, enum: ['LICENSE', 'INSURANCE', 'ID_PROOF', 'OTHER'], required: true },
        url: { type: String, required: true },
        status: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
        uploadedAt: { type: Date, default: Date.now }
    }]
});

export const DriverProfileModel = mongoose.model('DriverProfile', driverProfileSchema);
