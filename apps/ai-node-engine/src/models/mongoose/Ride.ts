import mongoose from 'mongoose';

const rideSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'DriverProfile' },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
    source: { type: String, required: true },
    destination: { type: String, required: true },
    distance: { type: Number, required: true },
    price: { type: Number, required: true },
    status: { type: String, default: 'PENDING' },
    pickupLat: { type: Number, required: true },
    pickupLng: { type: Number, required: true },
    dropLat: { type: Number, required: true },
    dropLng: { type: Number, required: true },
    startTime: Date,
    endTime: Date
}, { timestamps: true });

export const RideModel = mongoose.model('Ride', rideSchema);
