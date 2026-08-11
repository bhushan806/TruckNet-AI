// ── Admin Controller ──
// All handlers are ADMIN-only (enforced by admin.routes.ts middleware).
// Uses real Mongoose data via admin.service.ts — no Prisma, no fake numbers.
// SECURITY: role check happens at route level; controller trusts it is ADMIN.

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { AdminAuditModel } from '../models/mongoose/AdminAudit';
import { getTrafficMetrics } from '../utils/trafficMonitor';
import { chatWithAdminAI } from '../services/adminAiChat.service';
import {
    getPlatformOverview,
    getUserStatistics,
    getLoadStatistics,
    getTripStatistics,
    getSystemHealth,
    getRecentAuditLog,
} from '../services/admin.service';

// In-memory conversation store (per admin session — keyed by admin user ID)
// For production: replace with Redis TTL store
const conversationStore = new Map<string, Array<{ role: 'user' | 'assistant'; content: string }>>();

// ── Helper: log audit event ──
async function auditLog(req: AuthRequest, action: string, metadata: object = {}) {
    try {
        await AdminAuditModel.create({
            adminId: req.user!.id,
            adminEmail: req.user!.email,
            action,
            metadata,
        });
    } catch (err: any) {
        // Non-fatal — log warning but don't fail the request
        logger.warn('Audit log failed', { action, error: err.message });
    }
}

// ── GET /api/admin/overview ──
export const getOverview = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const data = await getPlatformOverview();
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        next(error);
    }
};

// ── GET /api/admin/users?period=7d&page=1&limit=50&role=&search= ──
export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const period = (req.query.period as string) || '7d';
        const data = await getUserStatistics(period);
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        next(error);
    }
};

// ── GET /api/admin/analytics?period=7d ──
export const getAnalytics = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const period = (req.query.period as string) || '7d';

        const [users, loads, trips] = await Promise.all([
            getUserStatistics(period),
            getLoadStatistics(period),
            getTripStatistics(period),
        ]);

        res.status(200).json({
            status: 'success',
            data: { period, users, loads, trips },
        });
    } catch (error) {
        next(error);
    }
};

// ── GET /api/admin/traffic ──
export const getTraffic = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const data = getTrafficMetrics(); // synchronous — in-memory
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        next(error);
    }
};

// ── GET /api/admin/system-health ──
export const getSystemHealthStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const data = await getSystemHealth();
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        next(error);
    }
};

// ── GET /api/admin/audit-log?limit=50 ──
export const getAuditLog = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
        const data = await getRecentAuditLog(limit);
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        next(error);
    }
};

// ── POST /api/admin/ai/chat ──
// Admin AI — read-only LLM that answers from real platform data
export const adminAiChat = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { message, resetHistory } = req.body;

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return next(new AppError('Message is required', 400));
        }

        if (message.length > 2000) {
            return next(new AppError('Message too long (max 2000 characters)', 400));
        }

        const adminId = req.user!.id;

        // Optionally reset conversation
        if (resetHistory) {
            conversationStore.delete(adminId);
        }

        const history = conversationStore.get(adminId) || [];
        const { reply, updatedHistory } = await chatWithAdminAI(message.trim(), history);

        // Persist updated history (bounded to 20 messages = 10 exchanges)
        conversationStore.set(adminId, updatedHistory.slice(-20));

        // Log AI usage (non-sensitive metadata only)
        await auditLog(req, 'ADMIN_AI_QUERY', { messageLength: message.length });

        res.status(200).json({ status: 'success', data: { reply } });
    } catch (error) {
        next(error);
    }
};

// ── POST /api/admin/view-as-role ──
// Records that admin is viewing as a specific role for audit purposes.
// IMPORTANT: This does NOT change authorization or issue new tokens.
// It is purely an audit record. The frontend manages view state in context.
export const recordViewAsRole = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { role } = req.body;
        const validRoles = ['CUSTOMER', 'DRIVER', 'OWNER', null];

        if (!validRoles.includes(role)) {
            return next(new AppError('Invalid role. Must be CUSTOMER, DRIVER, OWNER, or null', 400));
        }

        // SECURITY: validate that the request is from an actual ADMIN
        // (already guaranteed by the route middleware, but belt-and-suspenders)
        if (req.user!.role !== 'ADMIN') {
            return next(new AppError('Forbidden', 403));
        }

        if (role) {
            const action = `VIEW_AS_${role}` as 'VIEW_AS_CUSTOMER' | 'VIEW_AS_DRIVER' | 'VIEW_AS_OWNER';
            await auditLog(req, action, { viewedRole: role });
            logger.info('Admin role-view recorded', {
                adminId: req.user!.id,
                viewedRole: role,
            });
        } else {
            await auditLog(req, 'RETURN_TO_ADMIN', {});
        }

        res.status(200).json({
            status: 'success',
            data: {
                viewingAs: role,
                message: role
                    ? `Admin is viewing as ${role} — identity remains ADMIN`
                    : 'Returned to Admin view',
            },
        });
    } catch (error) {
        next(error);
    }
};

// ── Legacy: GET /api/admin/stats (backward compat with existing admin/page.tsx) ──
export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const overview = await getPlatformOverview();

        // Reshape to match the existing admin/page.tsx expected format
        res.status(200).json({
            status: 'success',
            data: {
                users: {
                    total: overview.users.total,
                    customers: overview.users.customers,
                    drivers: overview.users.drivers,
                    owners: overview.users.owners,
                },
                vehicles: {
                    total: overview.vehicles.total,
                    active: overview.vehicles.onTrip,
                    available: overview.vehicles.available,
                },
                rides: {
                    total: overview.rides.total,
                    ongoing: overview.rides.ongoing,
                    pending: overview.rides.pending,
                    completed: overview.rides.completed,
                },
                loads: {
                    total: overview.loads.total,
                },
                // No recentActivity from Prisma anymore — return empty array
                // The new dashboard fetches this from /api/admin/overview
                recentActivity: [],
            },
        });
    } catch (error) {
        next(error);
    }
};
