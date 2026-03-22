import { Request, Response, NextFunction } from 'express';
import { AssistantService } from '../services/assistant.service';

const assistantService = new AssistantService();

export const chat = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { message } = req.body;
        // In real app, get userId from req.user
        const userId = 'mock-user-id';

        const result = await assistantService.processCommand(userId, message);
        res.status(200).json({ status: 'success', data: result });
    } catch (error) {
        next(error);
    }
};

export const askAi = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { message, role } = req.body;

        if (!message) {
            res.status(400).json({ error: "Message is required" });
            return;
        }

        const result = await assistantService.askAI(message, role || 'User');

        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};
