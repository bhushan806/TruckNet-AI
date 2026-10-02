// ── Driver Invite Controller ──
// Handles the per-truck driver invitation flow:
//   POST /api/driver-invites/invite       — Owner invites driver by phone
//   POST /api/driver-invites/confirm      — Driver confirms via OTP
//   DELETE /api/driver-invites/:truckId   — Owner removes driver from truck

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { DriverInviteService } from '../services/driver-invite.service';
import { AppError } from '../utils/AppError';
import { z } from 'zod';

const inviteService = new DriverInviteService();

// ── Validation Schemas ──

const inviteSchema = z.object({
    truckId: z.string().min(1, 'Truck ID is required'),
    driverPhone: z.string()
        .regex(/^[6-9]\d{9}$/, 'Valid Indian 10-digit phone number required'),
});

const confirmSchema = z.object({
    phone: z.string()
        .regex(/^[6-9]\d{9}$/, 'Valid Indian 10-digit phone number required'),
    otp: z.string()
        .length(6, 'OTP must be 6 digits')
        .regex(/^\d{6}$/, 'OTP must be numeric'),
});

// ── Owner: Invite a driver to a truck ──
export const inviteDriver = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) return next(new AppError('User not authenticated', 401));

        const { truckId, driverPhone } = inviteSchema.parse(req.body);
        const link = await inviteService.inviteDriver(userId, truckId, driverPhone);

        res.status(201).json({
            status: 'success',
            message: 'Invite sent. Driver will receive an OTP to confirm.',
            data: {
                linkId: link._id.toString(),
                truckId,
                status: link.status,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ── Driver: Confirm invite via OTP ──
export const confirmInvite = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { phone, otp } = confirmSchema.parse(req.body);
        const link = await inviteService.confirmInvite(phone, otp);

        res.status(200).json({
            status: 'success',
            message: 'Invite confirmed. You are now assigned to this truck.',
            data: {
                linkId: link._id.toString(),
                truckId: link.truckId.toString(),
                status: link.status,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ── Owner: Remove driver from a truck ──
export const removeDriver = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) return next(new AppError('User not authenticated', 401));

        const { truckId } = req.params;
        if (!truckId) return next(new AppError('Truck ID is required', 400));

        const link = await inviteService.removeDriver(userId, truckId);

        res.status(200).json({
            status: 'success',
            message: 'Driver removed from truck.',
            data: {
                linkId: link._id.toString(),
                truckId: link.truckId.toString(),
                status: link.status,
            },
        });
    } catch (error) {
        next(error);
    }
};
