// ── Driver Invite Service ──
// Handles the per-truck driver invitation flow:
//   1. Owner invites driver by phone → DriverTruckLink created (status: invited)
//   2. Driver confirms via OTP → link confirmed, Vehicle.assignedDriverId set
//   3. Owner removes driver → link removed, Vehicle.assignedDriverId nulled
//
// Reuses the shared OtpService for OTP generation/verification.

import { DriverTruckLinkModel } from '../models/mongoose/DriverTruckLink';
import { VehicleModel } from '../models/mongoose/Vehicle';
import { UserModel } from '../models/mongoose/User';
import { OtpService } from './otp.service';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

const otpService = new OtpService();

export class DriverInviteService {
    /**
     * Owner invites a driver by phone number to a specific truck.
     * Creates a DriverTruckLink with status 'invited' and sends OTP.
     */
    async inviteDriver(ownerUserId: string, truckId: string, driverPhone: string) {
        // Verify truck exists and belongs to this owner
        const vehicle = await VehicleModel.findById(truckId);
        if (!vehicle) throw new AppError('Truck not found', 404);

        if (vehicle.ownerUserId?.toString() !== ownerUserId) {
            throw new AppError('This truck does not belong to you', 403);
        }

        // Check if truck already has an active (invited/confirmed) link
        const existingLink = await DriverTruckLinkModel.findOne({
            truckId,
            status: { $in: ['invited', 'confirmed'] },
        });
        if (existingLink) {
            throw new AppError(
                'This truck already has an active driver link. Remove the current driver first.',
                409
            );
        }

        // Find or note the driver user
        let driverUser = await UserModel.findOne({ phone: driverPhone });

        // Send OTP to driver's phone (creates placeholder user if new)
        await otpService.sendOtp(driverPhone, 'driver_invite');

        // Re-fetch in case sendOtp created a placeholder user
        if (!driverUser) {
            driverUser = await UserModel.findOne({ phone: driverPhone });
        }

        if (!driverUser) {
            throw new AppError('Failed to create invite for this phone number', 500);
        }

        // Create DriverTruckLink
        const link = await DriverTruckLinkModel.create({
            ownerId: ownerUserId,
            driverId: driverUser._id,
            truckId,
            status: 'invited',
            invitedAt: new Date(),
        });

        logger.info('Driver invited to truck', {
            ownerId: ownerUserId,
            truckId,
            driverPhone,
            linkId: link._id,
        });

        return link;
    }

    /**
     * Driver confirms an invitation via OTP.
     * Sets DriverTruckLink status to 'confirmed' and Vehicle.assignedDriverId.
     */
    async confirmInvite(driverPhone: string, otpCode: string) {
        // Verify OTP
        const { userId: driverUserId } = await otpService.verifyOtp(driverPhone, otpCode);

        // Find the pending invite for this driver
        const link = await DriverTruckLinkModel.findOne({
            driverId: driverUserId,
            status: 'invited',
        });

        if (!link) {
            throw new AppError('No pending invitation found for your account', 404);
        }

        // Confirm the link
        link.status = 'confirmed';
        link.confirmedAt = new Date();
        await link.save();

        // Set the vehicle's assignedDriverId
        await VehicleModel.findByIdAndUpdate(link.truckId, {
            $set: { assignedDriverId: driverUserId },
        });

        // Activate the user and set role to DRIVER if they were a placeholder
        const driverUser = await UserModel.findById(driverUserId);
        if (driverUser && !driverUser.isActive) {
            await UserModel.findByIdAndUpdate(driverUserId, {
                $set: {
                    isActive: true,
                    isVerified: true,
                    role: 'DRIVER',
                },
            });
        }

        logger.info('Driver invite confirmed', {
            driverId: driverUserId,
            truckId: link.truckId,
            linkId: link._id,
        });

        return link;
    }

    /**
     * Owner removes a driver from a truck.
     * Sets DriverTruckLink status to 'removed' and clears Vehicle.assignedDriverId.
     * History is preserved (not deleted).
     */
    async removeDriver(ownerUserId: string, truckId: string) {
        // Find active link for this truck
        const link = await DriverTruckLinkModel.findOne({
            truckId,
            ownerId: ownerUserId,
            status: { $in: ['invited', 'confirmed'] },
        });

        if (!link) {
            throw new AppError('No active driver link found for this truck', 404);
        }

        // Mark as removed (preserve history)
        link.status = 'removed';
        link.removedAt = new Date();
        await link.save();

        // Clear the vehicle's assignedDriverId
        await VehicleModel.findByIdAndUpdate(truckId, {
            $set: { assignedDriverId: null },
        });

        logger.info('Driver removed from truck', {
            ownerId: ownerUserId,
            truckId,
            driverId: link.driverId,
            linkId: link._id,
        });

        return link;
    }
}
