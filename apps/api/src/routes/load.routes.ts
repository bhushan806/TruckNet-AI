import { Router } from 'express';
import { protect, authorize } from '../middlewares/auth.middleware';
import { loadAcceptLimiter, driverStatusLimiter } from '../middlewares/rateLimiter';
import * as loadController from '../controllers/load.controller';

const router = Router();

// All load routes require authentication
router.use(protect);

// CUSTOMER routes
router.post('/', authorize('CUSTOMER'), loadController.createLoad);
router.get('/my-loads', authorize('CUSTOMER'), loadController.getMyLoads);
router.patch('/:loadId/cancel', authorize('CUSTOMER'), loadController.cancelLoad);

// OWNER routes
router.get('/open', authorize('OWNER'), loadController.getOpenLoads);
router.post('/:loadId/accept', authorize('OWNER'), loadAcceptLimiter, loadController.acceptLoad);
router.post('/:loadId/assign', authorize('OWNER'), loadController.assignDriver);
router.get('/owner-loads', authorize('OWNER'), loadController.getOwnerLoads);

// DRIVER routes
router.get('/driver-loads', authorize('DRIVER'), loadController.getDriverLoads);
router.patch('/:loadId/status', authorize('DRIVER'), driverStatusLimiter, loadController.updateLoadStatus);

export default router;
