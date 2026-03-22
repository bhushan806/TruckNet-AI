import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { MatchService } from '../services/match.service';

const matchService = new MatchService();

export const getMatches = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { loadId } = req.params;
        const matches = await matchService.findMatches(loadId);
        res.status(200).json({ status: 'success', data: matches });
    } catch (error) {
        next(error);
    }
};

export const acceptMatch = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { loadId } = req.params;
        const { vehicleId } = req.body;
        const ownerId = req.user?.id;

        if (!ownerId) return next(new Error('User not authenticated'));
        if (!vehicleId) return res.status(400).json({ status: 'error', message: 'vehicleId is required' });

        const result = await matchService.acceptMatch(loadId, vehicleId, ownerId);
        res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        next(error);
    }
};
