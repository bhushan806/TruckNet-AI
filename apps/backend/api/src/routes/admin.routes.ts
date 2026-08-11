// ── Admin Routes ──
// ALL routes protected: JWT authentication (protect) + ADMIN role (authorize).
// Frontend role manipulation CANNOT bypass these checks.
// SECURITY: never trust a role sent by the frontend.

import { Router } from 'express';
import { protect, authorize } from '../middlewares/auth.middleware'; // FIXED: was wrong import
import {
    getOverview,
    getUsers,
    getAnalytics,
    getTraffic,
    getSystemHealthStatus,
    getAuditLog,
    adminAiChat,
    recordViewAsRole,
    getDashboardStats,
} from '../controllers/admin.controller';
import { rateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// ── Apply authentication + ADMIN authorization to ALL admin routes ──
// No route in this file is accessible by non-admin users.
router.use(protect);
router.use(authorize('ADMIN'));

// ── Stricter rate limit for Admin AI (10 req/min per IP) ──
const adminAiLimiter = rateLimiter({
    windowMs: 60_000,
    max: 10,
    message: 'Too many Admin AI requests. Please wait a moment.',
});

// ── Analytics & Overview ──
router.get('/overview', getOverview);                   // Full platform snapshot
router.get('/users', getUsers);                         // User stats + table
router.get('/analytics', getAnalytics);                 // All analytics by period
router.get('/traffic', getTraffic);                     // Traffic metrics (in-memory)
router.get('/system-health', getSystemHealthStatus);    // Real service health checks
router.get('/audit-log', getAuditLog);                  // Admin audit trail

// ── Admin AI Assistant ──
router.post('/ops/chat', adminAiLimiter, adminAiChat);

// ── Role Switching Audit ──
// Records admin viewing as a role — does NOT change identity or authorization
router.post('/view-as-role', recordViewAsRole);

// ── Legacy stats endpoint (backward compat with existing admin/page.tsx) ──
router.get('/stats', getDashboardStats);

export default router;
