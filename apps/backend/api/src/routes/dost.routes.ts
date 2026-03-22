// ── TruckNet Dost Chat Routes ──
// POST /api/dost/chat — authenticated AI chat endpoint

import { Router, Response, NextFunction } from 'express';
import { protect, optionalAuth, AuthRequest } from '../middlewares/auth.middleware';
import { publicAiRateLimiter } from '../middlewares/rateLimit.middleware';
import { chat } from '../services/dost.service';
import { ChatModel } from '../models/mongoose/Chat';

const router = Router();

// Get history (optional auth - returns empty if not logged in)
router.get('/history', optionalAuth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            // Return empty history for public users seamlessly
            res.status(200).json({ status: 'success', history: [] });
            return;
        }

        const chatDoc = await ChatModel.findOne({ userId });
        res.status(200).json({
            status: 'success',
            history: chatDoc ? chatDoc.messages : []
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /history — clear only the authenticated user's chat
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

// POST /chat — AI interaction (supports both authenticated and public mode with rate limiting)
router.post('/chat', optionalAuth, publicAiRateLimiter, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { message, conversationHistory } = req.body;

        if (!message) {
            res.status(400).json({ status: 'error', message: 'Message is required' });
            return;
        }

        // Get role and userId from authenticated user context
        const role = req.user?.role || 'CUSTOMER';
        const userId = req.user?.id || 'anonymous';

        const result = await chat({
            message,
            role,
            userId,
            conversationHistory: conversationHistory || []
        });

        // Skip DB save for anonymous users
        if (userId !== 'anonymous') {
            try {
                let chatDoc = await ChatModel.findOne({ userId });
                if (!chatDoc) {
                    chatDoc = new ChatModel({ userId, role, messages: [] });
                }

                // Add user message
                chatDoc.messages.push({
                    role: 'user',
                    content: message,
                    timestamp: new Date()
                });

                // Add assistant response (including structuredData for rich card persistence)
                chatDoc.messages.push({
                    role: 'assistant',
                    content: result.reply,
                    action: result.actions?.length ? 'SHOW_ACTIONS' : undefined,
                    data: result.data,
                    structuredData: result.structuredData,
                    timestamp: new Date()
                });

                await chatDoc.save();
            } catch (dbError) {
                console.error('Failed to save chat to DB:', dbError);
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
});

export default router;
