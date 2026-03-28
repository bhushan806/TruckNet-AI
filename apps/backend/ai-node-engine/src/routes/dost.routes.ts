import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { chat } from '../services/dost.service';
import { logger } from '../utils/logger';

const router = Router();

// ── Helper: Extract userId + role from Bearer token ──
function extractUser(req: Request): { userId: string; role: string } | null {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null; // Return null if no valid token
        }
        const token = authHeader.split(' ')[1];
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) return null;

        const decoded = jwt.verify(token, jwtSecret) as any;
        const userId = decoded.userId || decoded.id || decoded.sub;
        const role = decoded.role || 'CUSTOMER';

        if (!userId) return null;
        return { userId: String(userId), role: String(role) };
    } catch {
        return null; // Failed to verify token
    }
}

// ── POST /api/dost/chat ──
router.post('/chat', async (req: Request, res: Response): Promise<any> => {
    try {
        const user = extractUser(req);
        if (!user) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized. Token missing or invalid.' });
        }
        const { userId, role } = user;

        const { message, conversationHistory } = req.body;

        if (!message || typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({
                status: 'error',
                reply: 'Kuch likho bhai! Main kya help kar sakta hoon? 📝',
            });
        }

        const result = await chat({
            message: message.trim(),
            role,
            userId,
            conversationHistory: conversationHistory || [],
        });

        // Persist chat to MongoDB
        try {
            const { ChatModel } = await import('../models/mongoose/Chat');
            await ChatModel.findOneAndUpdate(
                { userId },
                {
                    $setOnInsert: { userId, role },
                    $push: {
                        messages: {
                            $each: [
                                { role: 'user', content: message.trim(), timestamp: new Date() },
                                { role: 'assistant', content: result.reply, timestamp: new Date() },
                            ],
                        },
                    },
                },
                { upsert: true }
            );
        } catch (dbError: any) {
            logger.warn('Failed to persist chat to DB', { userId, error: dbError.message });
        }

        return res.json({
            status: 'success',
            reply: result.reply,
            language: result.language,
            module: result.module,
            actions: result.actions,
            data: result.data,
            structuredData: result.structuredData,
            predictiveIntelligence: result.predictiveIntelligence,
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        logger.error('Chat endpoint error', { error: error.message });
        return res.status(500).json({
            status: 'error',
            reply: 'TruckNet Dost is temporarily unavailable. Please try again later.',
        });
    }
});

// ── GET /api/dost/history ──
router.get('/history', async (req: Request, res: Response): Promise<any> => {
    try {
        const user = extractUser(req);
        if (!user) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }

        const { ChatModel } = await import('../models/mongoose/Chat');
        const chatDoc = await ChatModel.findOne({ userId: user.userId }).lean();

        if (!chatDoc) {
            return res.json({ status: 'success', history: [] });
        }

        const history = (chatDoc.messages || [])
            .filter((m: any) => m.role === 'user' || m.role === 'assistant')
            .slice(-50)
            .map((m: any) => ({ role: m.role, content: m.content }));

        return res.json({ status: 'success', history });
    } catch (error: any) {
        logger.error('History fetch error', { error: error.message });
        return res.status(500).json({ status: 'error', message: 'Failed to fetch history' });
    }
});

// ── DELETE /api/dost/history ──
router.delete('/history', async (req: Request, res: Response): Promise<any> => {
    try {
        const user = extractUser(req);
        if (!user) {
            return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        }

        const { ChatModel } = await import('../models/mongoose/Chat');
        await ChatModel.findOneAndUpdate(
            { userId: user.userId },
            { $set: { messages: [] } }
        );

        return res.json({ status: 'success', message: 'Chat history cleared' });
    } catch (error: any) {
        logger.error('History delete error', { error: error.message });
        return res.status(500).json({ status: 'error', message: 'Failed to clear history' });
    }
});

export default router;
