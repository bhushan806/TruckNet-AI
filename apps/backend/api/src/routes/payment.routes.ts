// ── Payment Routes ──
// Secure endpoints for Indian transportation milestone payments.

import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import { PaymentController } from '../controllers/payment.controller';
import { paymentOrderLimiter, paymentVerifyLimiter } from '../middlewares/rateLimiter';

const router = Router();

// All payment actions require authentication
router.use(protect);

router.post('/order', paymentOrderLimiter, PaymentController.createOrder);                        // POST /api/payments/order — Generate dynamic UPI QR
router.post('/verify-utr', paymentVerifyLimiter, PaymentController.verifyUtr);                     // POST /api/payments/verify-utr — Submit 12-digit UTR
router.post('/release-escrow', PaymentController.releaseEscrow);             // POST /api/payments/release-escrow — Release escrow balance
router.get('/by-load/:identifier', PaymentController.getPaymentDetails);     // GET  /api/payments/by-load/:identifier — Milestones & Escrow status

export default router;
