import { Router } from 'express';
import * as rideController from '../controllers/ride.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.post('/estimate', rideController.getEstimate);
router.post('/book', protect, rideController.bookRide);
router.get('/available', protect, rideController.getAvailableRides);
router.get('/tasks', protect, rideController.getDriverTasks);
router.get('/my-rides', protect, rideController.getCustomerRides);
router.post('/:id/accept', protect, rideController.acceptRide);
router.post('/:id/assign', protect, rideController.assignDriver);

export default router;
