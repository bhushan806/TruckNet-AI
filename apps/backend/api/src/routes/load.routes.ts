import { Router } from 'express';
import { protect, authorize, optionalAuth } from '../middlewares/auth.middleware';
import { loadAcceptLimiter, driverStatusLimiter } from '../middlewares/rateLimiter';
import * as loadController from '../controllers/load.controller';

const router = Router();

// Public tracking alias for visitors
router.get('/track/:identifier', optionalAuth, loadController.getLoadById);

// CUSTOMER routes (authenticated)
router.post('/', protect, authorize('CUSTOMER'), loadController.createLoad);
router.get('/my-loads', protect, authorize('CUSTOMER'), loadController.getMyLoads);
router.patch('/:loadId/cancel', protect, authorize('CUSTOMER'), loadController.cancelLoad);

// OWNER routes (authenticated)
router.get('/open', protect, authorize('OWNER'), loadController.getOpenLoads);
router.post('/:loadId/accept', protect, authorize('OWNER'), loadAcceptLimiter, loadController.acceptLoad);
router.post('/:loadId/assign', protect, authorize('OWNER'), loadController.assignDriver);
router.get('/owner-loads', protect, authorize('OWNER'), loadController.getOwnerLoads);

// DRIVER routes (authenticated)
router.get('/driver-loads', protect, authorize('DRIVER'), loadController.getDriverLoads);
router.patch('/:loadId/status', protect, authorize('DRIVER'), driverStatusLimiter, loadController.updateLoadStatus);

// Shared/Public tracking route: Get single load details (by _id, loadNumber, or transactionId)
router.get('/:loadId', optionalAuth, loadController.getLoadById);

export default router;
