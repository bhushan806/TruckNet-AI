import { Router } from 'express';
import * as vehicleController from '../controllers/vehicle.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', protect, vehicleController.createVehicle);
router.get('/', vehicleController.getVehicles);
router.put('/:id', protect, vehicleController.updateVehicle);

export default router;
