import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
    number: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    bodyType: {
        type: String,
        enum: ['CEMENT_BULKER', 'FLATBED', 'OPEN_HIGH_BED', 'CONTAINER_CLOSED', 'TANKER_LIQUID', 'TIPPER_DUMPER'],
        default: 'OPEN_HIGH_BED'
    },
    capacity: { type: Number, required: true }, // Capacity in metric tons
    status: { type: String, enum: ['AVAILABLE', 'ON_TRIP', 'MAINTENANCE'], default: 'AVAILABLE' },
    homeCity: { type: String, default: 'Mumbai', trim: true },
    baseRatePerKm: { type: Number, default: 25 },

    // ── Legacy refs (kept for backward compat with match.service, vehicle.service) ──
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'OwnerProfile', required: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'DriverProfile' },

    // ── New: User-level references for Trip/DriverTruckLink logic ──
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    // null = owner-operator (owner drives this truck themselves)
    // set = fleet driver assigned to this truck
    assignedDriverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // ── RC / Registration number (distinct from license plate 'number') ──
    rcNumber: { type: String, trim: true },

    currentLat: { type: Number, default: 19.0760 },
    currentLng: { type: Number, default: 72.8777 },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [72.8777, 19.0760] } // [lng, lat]
    }
}, { timestamps: true });

vehicleSchema.index({ location: '2dsphere' });
vehicleSchema.index({ status: 1, capacity: 1 });

export const VehicleModel = mongoose.model('Vehicle', vehicleSchema);

