import { Router } from 'express';
import * as matchController from '../controllers/match.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

router.get('/:loadId', matchController.getMatches);
router.post('/:loadId/accept', matchController.acceptMatch);

export default router;
