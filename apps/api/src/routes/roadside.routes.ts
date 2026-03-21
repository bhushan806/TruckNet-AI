import { Router } from 'express';
import * as roadsideController from '../controllers/roadside.controller';

const router = Router();

router.post('/report', roadsideController.reportBreakdown);
router.patch('/:id/status', roadsideController.updateStatus);
router.get('/nearby', roadsideController.getNearbyProviders);
router.get('/:id', roadsideController.getBreakdown);

export default router;
