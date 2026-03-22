import { Request, Response, NextFunction } from 'express';
import { ConnectionRequestModel } from '../models/mongoose/ConnectionRequest';
import { AuthRequest } from '../middlewares/auth.middleware';

export const sendRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { driverId, message } = req.body;
        const ownerId = req.user?.id;

        if (!ownerId) throw new Error('User not authenticated');

        // Check if request already exists
        const existingRequest = await ConnectionRequestModel.findOne({
            ownerId,
            driverId,
            status: 'PENDING'
        });

        if (existingRequest) {
            return res.status(400).json({ status: 'error', message: 'Request already pending' });
        }

        const request = await ConnectionRequestModel.create({
            ownerId,
            driverId,
            message,
            status: 'PENDING'
        });

        res.status(201).json({ status: 'success', data: request });
    } catch (error) {
        next(error);
    }
};

export const getDriverRequests = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const driverProfileId = (req.user as any).driverProfile?.id;
        if (!driverProfileId) throw new Error('Driver profile not found');

        const requests = await ConnectionRequestModel.find({
            driverId: driverProfileId,
            status: 'PENDING'
        }).populate('ownerId', 'name email phone avatar');

        res.status(200).json({ status: 'success', data: requests });
    } catch (error) {
        next(error);
    }
};

export const respondToRequest = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // ACCEPTED or REJECTED

        if (!['ACCEPTED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ status: 'error', message: 'Invalid status' });
        }

        const request = await ConnectionRequestModel.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!request) {
            return res.status(404).json({ status: 'error', message: 'Request not found' });
        }

        res.status(200).json({ status: 'success', data: request });
    } catch (error) {
        next(error);
    }
};
