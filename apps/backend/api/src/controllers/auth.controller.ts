import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AuthService } from '../services/auth.service';
import { AppError } from '../utils/AppError';
import { z } from 'zod';

const authService = new AuthService();

const registerSchema = z.object({
    email: z.string().email(),
    phone: z.string().min(10),
    password: z.string().min(6),
    name: z.string().min(2),
    role: z.enum(['DRIVER', 'OWNER', 'CUSTOMER']),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = registerSchema.parse(req.body);
        const result = await authService.register(data);
        res.status(201).json({ status: 'success', message: 'Registration successful', data: result });
    } catch (error) {
        next(error);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = loginSchema.parse(req.body);
        const result = await authService.login(data);
        res.status(200).json({ status: 'success', message: 'Login successful', data: result });
    } catch (error) {
        next(error);
    }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) throw new AppError('Refresh token required', 400);
        const result = await authService.refreshToken(refreshToken);
        res.status(200).json({ status: 'success', message: 'Token refreshed', data: result });
    } catch (error) {
        next(error);
    }
};

export const logout = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) return next(new AppError('User not authenticated', 401));
        const result = await authService.logout(userId);
        res.status(200).json({ status: 'success', message: result.message });
    } catch (error) {
        next(error);
    }
};

export const getDrivers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await authService.getDrivers();
        res.status(200).json({ status: 'success', message: 'Drivers fetched', data: result });
    } catch (error) {
        next(error);
    }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;
        if (!email) throw new AppError('Email is required', 400);
        const result = await authService.forgotPassword(email);
        res.status(200).json({ status: 'success', message: result.message, data: result });
    } catch (error) {
        next(error);
    }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) throw new AppError('Token and new password are required', 400);
        const result = await authService.resetPassword(token, newPassword);
        res.status(200).json({ status: 'success', message: result.message });
    } catch (error) {
        next(error);
    }
};
