import { Router } from 'express';
import * as aiController from '../controllers/ai.controller';
import { protect, optionalAuth } from '../middlewares/auth.middleware';

const router = Router();

// AI Intelligence Endpoints
router.post('/insights', aiController.getInsights);
router.post('/sos', optionalAuth, aiController.triggerSos);
router.post('/seed', aiController.seedData);

export default router;
