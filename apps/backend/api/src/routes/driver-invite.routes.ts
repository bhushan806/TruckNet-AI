// ── Driver Invite Routes ──
// Per-truck driver invitation/assignment flow.
//   POST   /invite    — Owner invites driver (sends OTP)
//   POST   /confirm   — Driver confirms invite (verifies OTP)
//   DELETE /:truckId  — Owner removes driver from truck

import { Router } from 'express';
import { protect, authorize } from '../middlewares/auth.middleware';
import * as inviteController from '../controllers/driver-invite.controller';

const router = Router();

// All invite routes require authentication
router.use(protect);

// Owner invites a driver to a truck
router.post('/invite', authorize('OWNER'), inviteController.inviteDriver);

// Driver confirms the invite via OTP (driver must be logged in — at least via OTP auth)
router.post('/confirm', inviteController.confirmInvite);

// Owner removes a driver from a truck
router.delete('/:truckId', authorize('OWNER'), inviteController.removeDriver);

export default router;
