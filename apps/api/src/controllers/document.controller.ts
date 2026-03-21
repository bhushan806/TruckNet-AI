import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import DocumentModel from '../models/Document';
import { logger } from '../utils/logger';

export const getDocuments = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) return next(new Error('User not authenticated'));

        const docs = await DocumentModel.find({ owner: userId }).sort({ createdAt: -1 });
        res.json({ status: 'success', data: docs });
    } catch (error) {
        next(error);
    }
};

export const uploadDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) return next(new Error('User not authenticated'));

        const { title, type, expiryDate, entityId } = req.body;

        let fileUrl = '';
        if (req.file) {
            fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        }

        const newDoc = await DocumentModel.create({
            owner: userId,
            title,
            type,
            entityId,
            url: fileUrl || 'https://via.placeholder.com/150',
            expiryDate,
            status: 'valid'
        });

        res.status(201).json({ status: 'success', data: newDoc });
    } catch (error) {
        logger.error('Upload error', { error: (error as any).message });
        next(error);
    }
};
