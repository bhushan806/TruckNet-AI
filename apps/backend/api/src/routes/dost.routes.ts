// ── TruckNet Dost Chat Routes ──
// SECURITY FIXES:
//   - Message length limited to 1000 chars (prevents token cost abuse)
//   - Conversation history limited to 20 turns (prevents context stuffing)
//   - console.error replaced with structured logger
//   - Input validation via Zod on chat body

import { Router, Response, NextFunction } from 'express';
import { protect, optionalAuth, AuthRequest } from '../middlewares/auth.middleware';
import { publicAiRateLimiter } from '../middlewares/rateLimit.middleware';
import { chat } from '../services/dost.service';
import { ChatModel } from '../models/mongoose/Chat';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// ── Zod validation schema for chat input ──
const chatSchema = z.object({
    message: z
        .string()
        .min(1, 'Message cannot be empty')
        .max(1000, 'Message too long — maximum 1000 characters')
        .trim(),
    conversationHistory: z
        .array(
            z.object({
                role: z.enum(['user', 'assistant']),
                content: z.string().max(2000), // Cap each history message
            })
        )
        .max(20, 'Conversation history too long — maximum 20 turns')
        .default([]),
});

// ── GET /api/dost/history — get chat history (optional auth) ──
router.get('/history', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(200).json({ status: 'success', history: [] });
            return;
        }

        const chatDoc = await ChatModel.findOne({ userId });
        res.status(200).json({
            status: 'success',
            history: chatDoc ? chatDoc.messages : [],
        });
    } catch (error) {
        next(error);
    }
});

// ── DELETE /api/dost/history — clear authenticated user's own chat history ──
router.delete('/history', protect, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ status: 'error', message: 'Unauthorized' });
            return;
        }

        await ChatModel.deleteOne({ userId });
        res.status(200).json({ status: 'success', message: 'Chat history cleared' });
    } catch (error) {
        next(error);
    }
});

// ── POST /api/dost/chat — AI interaction ──
router.post(
    '/chat',
    optionalAuth,
    publicAiRateLimiter,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            // FIX: Validate and sanitize chat input (message length + history limits)
            const parseResult = chatSchema.safeParse(req.body);
            if (!parseResult.success) {
                res.status(400).json({
                    status: 'error',
                    message: parseResult.error.errors[0]?.message || 'Invalid input',
                });
                return;
            }

            const { message, conversationHistory } = parseResult.data;

            const role = req.user?.role || 'CUSTOMER';
            const userId = req.user?.id || 'anonymous';

            const result = await chat({
                message,
                role,
                userId,
                conversationHistory,
            });

            // Skip DB save for anonymous users
            if (userId !== 'anonymous') {
                try {
                    let chatDoc = await ChatModel.findOne({ userId });
                    if (!chatDoc) {
                        chatDoc = new ChatModel({ userId, role, messages: [] });
                    }

                    chatDoc.messages.push({
                        role: 'user',
                        content: message,
                        timestamp: new Date(),
                    });

                    chatDoc.messages.push({
                        role: 'assistant',
                        content: result.reply,
                        action: result.actions?.length ? 'SHOW_ACTIONS' : undefined,
                        data: result.data,
                        structuredData: result.structuredData,
                        timestamp: new Date(),
                    });

                    // Keep only last 100 messages to prevent unlimited growth
                    if (chatDoc.messages.length > 100) {
                        chatDoc.messages = chatDoc.messages.slice(-100);
                    }

                    await chatDoc.save();
                } catch (dbError) {
                    // FIX: Use structured logger instead of console.error
                    logger.error('Failed to save chat to DB', {
                        userId,
                        error: (dbError as any).message,
                    });
                }
            }

            res.status(200).json({
                status: 'success',
                reply: result.reply,
                language: result.language,
                module: result.module,
                actions: result.actions,
                data: result.data,
                structuredData: result.structuredData,
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
