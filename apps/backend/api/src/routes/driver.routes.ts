import { Router } from 'express';
import {
    getProfile,
    updateProfile,
    toggleStatus,
    getAllDrivers,
    getMyDrivers,
    getNotifications,
} from '../controllers/driver.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/', protect, getAllDrivers);
router.get('/all', protect, getAllDrivers);
router.get('/my-drivers', protect, getMyDrivers);
router.get('/notifications', protect, getNotifications);
router.post('/status', protect, toggleStatus);

export default router;

