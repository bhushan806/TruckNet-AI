// ── Auth Routes ──
// FIX 5: Cookie-based auth endpoints
// FIX 7: Phone OTP authentication routes added

import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { protect } from '../middlewares/auth.middleware';
import { authLimiter } from '../middlewares/rateLimiter';
import { rateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// ── Rate limiters ──
// Max 3 OTP send requests per phone per 15 minutes
const otpSendLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: '15 minute mein maximum 3 OTP request ho sakte hain. Thodi der baad try karo.',
});

// ── Rate limit all auth routes globally ──
router.use(authLimiter);

// ── Email/Password Auth (admin + fallback) ──
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', protect, authController.logout);

// ── Session verification (for Next.js middleware / page loads) ──
router.get('/me', protect, authController.getMe);

// ── FIX 7: Phone OTP Auth ──
router.post('/send-otp', otpSendLimiter, authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);

// ── Other routes ──
router.get('/drivers', authController.getDrivers);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

export default router;
