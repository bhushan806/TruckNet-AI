import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
    number: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    capacity: { type: Number, required: true },
    status: { type: String, enum: ['AVAILABLE', 'ON_TRIP', 'MAINTENANCE'], default: 'AVAILABLE' },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'OwnerProfile', required: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'DriverProfile' },
    currentLat: { type: Number },
    currentLng: { type: Number }
}, { timestamps: true });

export const VehicleModel = mongoose.model('Vehicle', vehicleSchema);
