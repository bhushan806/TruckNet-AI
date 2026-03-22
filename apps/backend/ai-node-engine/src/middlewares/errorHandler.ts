import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';

export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
    // ── Classify and normalize errors ──

    // Zod validation errors
    if (err instanceof ZodError) {
        const message = err.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
        logger.warn('Validation error', { path: req.path, message });
        return res.status(400).json({
            status: 'error',
            message: `Validation failed: ${message}`,
        });
    }

    // Mongoose ValidationError
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e: any) => e.message);
        logger.warn('Mongoose validation error', { path: req.path, messages });
        return res.status(400).json({
            status: 'error',
            message: `Validation failed: ${messages.join(', ')}`,
        });
    }

    // Mongoose CastError (invalid ObjectId)
    if (err.name === 'CastError') {
        logger.warn('Cast error', { path: req.path, value: err.value });
        return res.status(400).json({
            status: 'error',
            message: `Invalid ${err.path}: ${err.value}`,
        });
    }

    // MongoDB duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        logger.warn('Duplicate key error', { path: req.path, field });
        return res.status(409).json({
            status: 'error',
            message: `Duplicate value for ${field}. This ${field} already exists.`,
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            status: 'error',
            message: 'Invalid token',
        });
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            status: 'error',
            message: 'Token has expired',
        });
    }

    // ── AppError (operational) ──
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    }

    // ── Unhandled / programming error ──
    logger.error('Unhandled error', {
        path: req.path,
        method: req.method,
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });

    res.status(500).json({
        status: 'error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    });
};
