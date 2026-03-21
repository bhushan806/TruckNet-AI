import { Router } from 'express';
import { getProfile, toggleStatus, getAllDrivers, getMyDrivers } from '../controllers/driver.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.get('/profile', protect, getProfile);
router.get('/', protect, getAllDrivers);
router.get('/all', protect, getAllDrivers);
router.get('/my-drivers', protect, getMyDrivers);
router.post('/status', protect, toggleStatus);

export default router;
