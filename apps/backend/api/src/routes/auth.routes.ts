// ── Auth Routes ──
// SECURITY FIXES:
//   - GET /drivers now requires authentication + OWNER/ADMIN role
//   - /logout-all-devices endpoint added (new)
//   - authLimiter applied before all auth routes

import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { protect, authorize } from '../middlewares/auth.middleware';
import { authLimiter } from '../middlewares/rateLimiter';
import { rateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// ── Rate limiters ──
const otpSendLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: '15 minute mein maximum 3 OTP request ho sakte hain. Thodi der baad try karo.',
});

// ── Apply auth rate limiter to all auth routes ──
router.use(authLimiter);

// ── Email/Password Auth ──
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', protect, authController.logout);
router.post('/logout-all', protect, authController.logoutAllDevices);

// ── Session verification ──
router.get('/me', protect, authController.getMe);

// ── Phone OTP Auth ──
router.post('/send-otp', otpSendLimiter, authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);

// ── FIX: GET /drivers — was unauthenticated, now requires OWNER or ADMIN role ──
router.get('/drivers', protect, authorize('OWNER', 'ADMIN'), authController.getDrivers);

// ── Password Reset ──
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

export default router;
