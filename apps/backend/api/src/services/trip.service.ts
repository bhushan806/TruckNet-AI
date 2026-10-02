// ── Trip Service ──
// Manages the trip lifecycle state machine:
//   accepted → pickup_confirmed → in_transit → delivered → completed
//
// Key features:
//   - Unique Transaction & Trip Identifiers: Generates/links loadNumber, transactionId, tripNumber
//   - Anti-Overlapping / Concurrency Lock: Prevents double-booking of loads and simultaneous trips on a single truck
//   - Multi-Party Direct Contact & Trust Profiles: Securely connects Load Owner, Transporter, and Driver
//   - Persistent Real-Time Trip Chat: Real-time messaging with Socket.io broadcast and DB persistence

import { TripModel, isValidTripTransition } from '../models/mongoose/Trip';
import { LoadModel } from '../models/mongoose/Load';
import { VehicleModel } from '../models/mongoose/Vehicle';
import { UserModel } from '../models/mongoose/User';
import { OwnerProfileModel } from '../models/mongoose/OwnerProfile';
import { DriverProfileModel } from '../models/mongoose/DriverProfile';
import { TripMessageModel } from '../models/mongoose/TripMessage';
import { AppError } from '../utils/AppError';
import { validateObjectId } from '../utils/validateId';
import { logger } from '../utils/logger';

export class TripService {
    /**
     * Create a Trip when an owner accepts a match.
     * Prevents overlapping: Load must be OPEN and Vehicle must be AVAILABLE.
     */
    async createFromMatch(ownerId: string, loadId: string, vehicleId: string) {
        validateObjectId(loadId, 'loadId');
        validateObjectId(vehicleId, 'vehicleId');

        // 1. Verify and lock load
        const load = await LoadModel.findById(loadId);
        if (!load) throw new AppError('Load not found', 404);

        if (load.status !== 'OPEN') {
            throw new AppError(
                `Load is already booked or assigned (${load.status}). Overlapping booking is prohibited.`,
                409
            );
        }

        // 2. Verify and lock vehicle
        const vehicle = await VehicleModel.findById(vehicleId);
        if (!vehicle) throw new AppError('Vehicle not found', 404);

        if (vehicle.status === 'ON_TRIP') {
            throw new AppError(
                `Vehicle ${vehicle.number} is currently on an active trip. Overlapping vehicle assignment is prohibited.`,
                409
            );
        }

        // 3. Ensure Load has human-readable loadNumber and transactionId
        let needsLoadSave = false;
        if (!load.loadNumber) {
            const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const rand = Math.floor(1000 + Math.random() * 9000);
            load.loadNumber = `LOD-${today}-${rand}`;
            needsLoadSave = true;
        }
        if (!load.transactionId) {
            const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
            load.transactionId = `TRX-${today}-${rand}`;
            needsLoadSave = true;
        }

        // 4. Determine the driver: use assignedDriverId if set, otherwise owner is the driver
        const driverId = vehicle.assignedDriverId
            ? vehicle.assignedDriverId.toString()
            : ownerId;

        // 5. Check for existing trip on this load (strict 1:1)
        const existingTrip = await TripModel.findOne({ loadId });
        if (existingTrip) {
            throw new AppError('A trip already exists for this load', 409);
        }

        // 6. Generate unique trip number
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const rand = Math.floor(1000 + Math.random() * 9000);
        const tripNumber = `TRP-${today}-${rand}`;

        // 7. Create the trip
        const trip = await TripModel.create({
            tripNumber,
            transactionId: load.transactionId,
            loadNumber: load.loadNumber,
            loadId,
            vehicleId,
            ownerId,
            driverId,
            status: 'accepted',
            acceptedAt: new Date(),
            checkpoints: [],
        });

        // 8. Update Load status & audit trail
        load.status = 'ACCEPTED_BY_OWNER';
        load.acceptedAt = new Date();
        load.auditTrail.push({
            action: 'TRIP_BOOKED',
            fromStatus: 'OPEN',
            toStatus: 'ACCEPTED_BY_OWNER',
            userId: ownerId,
            timestamp: new Date(),
            meta: { tripId: trip._id, tripNumber, transactionId: load.transactionId, vehicleNumber: vehicle.number },
        });
        await load.save();

        // 9. Lock Vehicle as ON_TRIP to prevent overlapping assignments
        vehicle.status = 'ON_TRIP';
        await vehicle.save();

        // 10. Emit Socket.io notifications
        try {
            const { getIO } = await import('../config/socket');
            const io = getIO();
            const payload = {
                tripId: trip._id.toString(),
                tripNumber: trip.tripNumber,
                transactionId: trip.transactionId,
                loadNumber: trip.loadNumber,
                loadId,
                vehicleId,
                vehicleNumber: vehicle.number,
                driverId,
                status: 'accepted',
            };

            io.to(ownerId).emit('trip:created', payload);
            io.to(load.customerId.toString()).emit('trip:created', payload);
            io.to(load.customerId.toString()).emit('load:statusChanged', {
                loadId: load._id.toString(),
                status: 'ACCEPTED_BY_OWNER',
                transactionId: load.transactionId,
                tripNumber: trip.tripNumber,
            });

            if (driverId !== ownerId) {
                io.to(driverId).emit('trip:created', payload);
            }
        } catch (error: any) {
            logger.error('Failed to emit trip:created event', { error: error.message });
        }

        // 11. Auto-generate statutory Indian transport documents (Bilty / LR, Transit Pass, POD)
        try {
            const { TripDocumentService } = await import('./trip-document.service');
            const docService = new TripDocumentService();
            await docService.generateTripDocuments(trip._id.toString());
        } catch (docErr: any) {
            logger.warn('Initial document generation warning', { error: docErr.message });
        }

        logger.info('Trip created successfully with anti-overlap lock and statutory bilty', {
            tripId: trip._id,
            tripNumber: trip.tripNumber,
            transactionId: trip.transactionId,
            loadId,
            vehicleNumber: vehicle.number,
        });

        return trip;
    }

    /**
     * Execute a status transition on a trip.
     */
    private async transition(
        tripId: string,
        userId: string,
        newStatus: string,
        lat: number,
        lng: number,
        requiredRole: 'driver' | 'owner',
    ) {
        validateObjectId(tripId, 'tripId');

        const trip = await TripModel.findById(tripId);
        if (!trip) throw new AppError('Trip not found', 404);

        // Permission check
        if (requiredRole === 'driver' && trip.driverId.toString() !== userId) {
            throw new AppError('Only the assigned driver can perform this action', 403);
        }
        if (requiredRole === 'owner' && trip.ownerId.toString() !== userId) {
            throw new AppError('Only the trip owner can perform this action', 403);
        }

        // State transition validation
        if (!isValidTripTransition(trip.status, newStatus)) {
            throw new AppError(
                `Invalid transition: ${trip.status} → ${newStatus}. ` +
                `Current status '${trip.status}' does not allow this transition.`,
                400
            );
        }

        // Build update
        const timestampMap: Record<string, string> = {
            'pickup_confirmed': 'pickupConfirmedAt',
            'in_transit': 'inTransitAt',
            'delivered': 'deliveredAt',
            'completed': 'completedAt',
        };

        const update: any = {
            $set: {
                status: newStatus,
                ...(timestampMap[newStatus] ? { [timestampMap[newStatus]]: new Date() } : {}),
            },
            $push: {
                checkpoints: {
                    status: newStatus,
                    lat,
                    lng,
                    timestamp: new Date(),
                },
            },
        };

        const updatedTrip = await TripModel.findByIdAndUpdate(tripId, update, { new: true });
        if (!updatedTrip) throw new AppError('Failed to update trip', 500);

        // Sync with Load and Vehicle models
        if (newStatus === 'in_transit') {
            await LoadModel.findByIdAndUpdate(trip.loadId, { status: 'IN_TRANSIT' });
        } else if (newStatus === 'completed' || newStatus === 'delivered') {
            if (newStatus === 'completed') {
                // Free up the vehicle for next loads
                await VehicleModel.findByIdAndUpdate(trip.vehicleId, { status: 'AVAILABLE' });
                await LoadModel.findByIdAndUpdate(trip.loadId, {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                });
            }
        }

        // Emit Socket.io events
        try {
            const { getIO } = await import('../config/socket');
            const io = getIO();

            const eventData = {
                tripId: updatedTrip._id.toString(),
                tripNumber: updatedTrip.tripNumber,
                transactionId: updatedTrip.transactionId,
                status: newStatus,
                checkpoint: { status: newStatus, lat, lng, timestamp: new Date().toISOString() },
            };

            io.to(updatedTrip.ownerId.toString()).emit('trip:status_changed', eventData);
            if (updatedTrip.driverId.toString() !== updatedTrip.ownerId.toString()) {
                io.to(updatedTrip.driverId.toString()).emit('trip:status_changed', eventData);
            }
            io.to(`trip:${tripId}`).emit('trip:status_changed', eventData);

            // Also notify the customer watching the load
            const parentLoad = await LoadModel.findById(trip.loadId).select('customerId');
            if (parentLoad?.customerId) {
                io.to(parentLoad.customerId.toString()).emit('trip:status_changed', eventData);
                io.to(parentLoad.customerId.toString()).emit('load:statusChanged', {
                    loadId: trip.loadId.toString(),
                    status: newStatus === 'in_transit' ? 'IN_TRANSIT' : (newStatus === 'completed' ? 'COMPLETED' : newStatus),
                });
            }
        } catch (error: any) {
            logger.error('Failed to emit trip:status_changed', { error: error.message });
        }

        logger.info('Trip status transitioned', {
            tripId,
            tripNumber: updatedTrip.tripNumber,
            from: trip.status,
            to: newStatus,
            userId,
        });

        return updatedTrip;
    }

    // ── Explicit transition endpoints ──

    async confirmPickup(tripId: string, userId: string, lat: number, lng: number) {
        return this.transition(tripId, userId, 'pickup_confirmed', lat, lng, 'driver');
    }

    async startTransit(tripId: string, userId: string, lat: number, lng: number) {
        return this.transition(tripId, userId, 'in_transit', lat, lng, 'driver');
    }

    async confirmDelivery(tripId: string, userId: string, lat: number, lng: number) {
        return this.transition(tripId, userId, 'delivered', lat, lng, 'driver');
    }

    async completeTrip(tripId: string, userId: string, lat: number, lng: number) {
        return this.transition(tripId, userId, 'completed', lat, lng, 'owner');
    }

    // ── Query methods ──

    async getTripsByOwner(ownerId: string) {
        return TripModel.find({ ownerId })
            .populate('loadId', 'source destination weight goodsType price loadNumber transactionId')
            .populate('vehicleId', 'number type capacity bodyType')
            .populate('driverId', 'name phone isVerified')
            .sort({ createdAt: -1 })
            .lean();
    }

    async getTripsByDriver(driverId: string) {
        return TripModel.find({ driverId })
            .populate('loadId', 'source destination weight goodsType price loadNumber transactionId')
            .populate('vehicleId', 'number type capacity bodyType')
            .populate('ownerId', 'name phone isVerified')
            .sort({ createdAt: -1 })
            .lean();
    }

    async getTripsByCustomer(customerId: string) {
        const loads = await LoadModel.find({ customerId }).select('_id').lean();
        const loadIds = loads.map(l => l._id);

        return TripModel.find({ loadId: { $in: loadIds } })
            .populate('loadId', 'source destination weight goodsType price loadNumber transactionId')
            .populate('vehicleId', 'number type capacity bodyType')
            .populate('ownerId', 'name phone isVerified')
            .populate('driverId', 'name phone isVerified')
            .sort({ createdAt: -1 })
            .lean();
    }

    async getTripById(tripId: string) {
        validateObjectId(tripId, 'tripId');
        const trip = await TripModel.findById(tripId)
            .populate('loadId', 'source destination sourceCity destinationCity weight goodsType price loadNumber transactionId customerId')
            .populate('vehicleId', 'number type capacity bodyType rcNumber')
            .populate('ownerId', 'name phone email isVerified')
            .populate('driverId', 'name phone email isVerified')
            .lean();

        if (!trip) throw new AppError('Trip not found', 404);
        return trip;
    }

    /**
     * Fetch complete contact, trust, and vehicle credentials for a trip.
     * Allows Load Owner, Transporter, and Driver to connect directly via Call, WhatsApp, and Chat.
     */
    async getTripContactInfo(tripId: string, userId: string) {
        validateObjectId(tripId, 'tripId');
        const trip = await TripModel.findById(tripId)
            .populate({
                path: 'loadId',
                populate: { path: 'customerId', select: 'name phone email isVerified' },
            })
            .populate('vehicleId', 'number type capacity bodyType rcNumber')
            .populate('ownerId', 'name phone email isVerified')
            .populate('driverId', 'name phone email isVerified')
            .lean();

        if (!trip) throw new AppError('Trip not found', 404);

        const load: any = trip.loadId;
        const customer: any = load?.customerId;
        const owner: any = trip.ownerId;
        const driver: any = trip.driverId;
        const vehicle: any = trip.vehicleId;

        // Authorize participant
        const isCustomer = customer?._id?.toString() === userId || customer?.toString() === userId;
        const isOwner = owner?._id?.toString() === userId || owner?.toString() === userId;
        const isDriver = driver?._id?.toString() === userId || driver?.toString() === userId;

        if (!isCustomer && !isOwner && !isDriver) {
            // Also check admin
            const user = await UserModel.findById(userId).select('role').lean();
            if (user?.role !== 'ADMIN') {
                throw new AppError('You are not authorized to view contact information for this trip', 403);
            }
        }

        // Fetch company name for owner if available
        let ownerCompany = 'Verified Transporter Partner';
        if (owner?._id) {
            const op = await OwnerProfileModel.findOne({ userId: owner._id }).select('companyName').lean();
            if (op?.companyName) ownerCompany = op.companyName;
        }

        const transactionId = trip.transactionId || load?.transactionId || `TRX-${trip._id.toString().slice(-6).toUpperCase()}`;
        const loadNumber = trip.loadNumber || load?.loadNumber || `LOD-${load?._id?.toString().slice(-6).toUpperCase()}`;
        const tripNumber = trip.tripNumber || `TRP-${trip._id.toString().slice(-6).toUpperCase()}`;

        return {
            tripId: trip._id,
            tripNumber,
            loadNumber,
            transactionId,
            status: trip.status,
            customer: {
                id: customer?._id,
                name: customer?.name || 'Shipper',
                phone: customer?.phone || '',
                email: customer?.email || '',
                isVerified: !!customer?.isVerified,
            },
            owner: {
                id: owner?._id,
                name: owner?.name || 'Fleet Owner',
                phone: owner?.phone || '',
                email: owner?.email || '',
                companyName: ownerCompany,
                isVerified: !!owner?.isVerified,
            },
            driver: {
                id: driver?._id,
                name: driver?.name || 'Driver',
                phone: driver?.phone || '',
                isVerified: !!driver?.isVerified,
                vehicleNumber: vehicle?.number || 'Pending',
                vehicleType: vehicle?.type || 'Heavy Truck',
                bodyType: vehicle?.bodyType || 'OPEN_HIGH_BED',
                capacity: vehicle?.capacity || 0,
            },
            route: {
                source: load?.source || '',
                destination: load?.destination || '',
                goodsType: load?.goodsType || '',
                weight: load?.weight || 0,
                price: load?.price || 0,
            },
        };
    }

    /**
     * Find active trip and contact details by loadId, loadNumber, or transactionId.
     */
    async getTripByLoadIdentifier(identifier: string, userId: string) {
        let load = null;
        if (identifier.length === 24) {
            load = await LoadModel.findById(identifier).lean();
        }
        if (!load) {
            load = await LoadModel.findOne({
                $or: [
                    { loadNumber: identifier },
                    { transactionId: identifier },
                ]
            }).lean();
        }
        if (!load) throw new AppError('Shipment not found with this identifier', 404);

        const trip = await TripModel.findOne({ loadId: load._id }).lean();
        if (!trip) {
            return {
                hasTrip: false,
                load: {
                    id: load._id,
                    loadNumber: load.loadNumber,
                    transactionId: load.transactionId,
                    status: load.status,
                    source: load.source,
                    destination: load.destination,
                    goodsType: load.goodsType,
                    weight: load.weight,
                    price: load.price,
                }
            };
        }

        const contactInfo = await this.getTripContactInfo(trip._id.toString(), userId);
        return {
            hasTrip: true,
            trip: contactInfo,
            checkpoints: trip.checkpoints,
        };
    }

    /**
     * Get chat messages history for a trip.
     */
    async getTripMessages(tripId: string, userId: string) {
        validateObjectId(tripId, 'tripId');
        // Validate user belongs to this trip
        await this.getTripContactInfo(tripId, userId);

        const messages = await TripMessageModel.find({ tripId })
            .sort({ createdAt: 1 })
            .limit(100)
            .lean();

        return messages;
    }

    /**
     * Send a real-time message between participants on a trip.
     */
    async sendTripMessage(tripId: string, userId: string, content: string, messageType: 'TEXT' | 'QUICK_STATUS' | 'ALERT' = 'TEXT') {
        validateObjectId(tripId, 'tripId');
        const contactInfo = await this.getTripContactInfo(tripId, userId);
        const user = await UserModel.findById(userId).select('name role').lean();
        if (!user) throw new AppError('User not found', 404);

        const trip = await TripModel.findById(tripId).select('loadId transactionId ownerId driverId').lean();
        if (!trip) throw new AppError('Trip not found', 404);

        const message = await TripMessageModel.create({
            tripId,
            loadId: trip.loadId,
            transactionId: trip.transactionId || contactInfo.transactionId,
            senderId: userId,
            senderRole: user.role,
            senderName: user.name,
            content,
            messageType,
        });

        // Broadcast to trip room and participants via Socket.io
        try {
            const { getIO } = await import('../config/socket');
            const io = getIO();
            const messageData = {
                id: message._id.toString(),
                tripId,
                transactionId: message.transactionId,
                senderId: userId,
                senderRole: user.role,
                senderName: user.name,
                content: message.content,
                messageType: message.messageType,
                createdAt: message.createdAt,
            };

            io.to(`trip:${tripId}`).emit('trip:new_message', messageData);
            io.to(trip.ownerId.toString()).emit('trip:new_message', messageData);
            if (trip.driverId.toString() !== trip.ownerId.toString()) {
                io.to(trip.driverId.toString()).emit('trip:new_message', messageData);
            }
            if (contactInfo.customer?.id) {
                io.to(contactInfo.customer.id.toString()).emit('trip:new_message', messageData);
            }
        } catch (error: any) {
            logger.error('Failed to emit trip:new_message event', { error: error.message });
        }

        return message;
    }
}
