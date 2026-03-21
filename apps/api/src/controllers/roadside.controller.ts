import { Request, Response, NextFunction } from 'express';
import { RoadsideService } from '../services/roadside.service';

const roadsideService = new RoadsideService();

export const reportBreakdown = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.body;
        // In a real app, driverId would come from req.user
        const result = await roadsideService.reportBreakdown(data);
        res.status(201).json({ status: 'success', data: result });
    } catch (error) {
        next(error);
    }
};

export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { status, eta, providerId } = req.body;
        const result = await roadsideService.updateStatus(id, status, eta, providerId);
        res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        next(error);
    }
};

export const getNearbyProviders = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { lat, lng, type } = req.query;
        if (!lat || !lng) throw new Error('Location required');

        const providers = await roadsideService.findNearbyProviders(
            { lat: Number(lat), lng: Number(lng) },
            type as string
        );
        res.status(200).json({ status: 'success', data: providers });
    } catch (error) {
        next(error);
    }
};

export const getBreakdown = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const breakdown = await roadsideService.getBreakdown(id);
        if (!breakdown) throw new Error('Breakdown not found');
        res.status(200).json({ status: 'success', data: breakdown });
    } catch (error) {
        next(error);
    }
};
