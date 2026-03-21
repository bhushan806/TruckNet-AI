import { Router } from 'express';
import * as matchController from '../controllers/match.controller';

const router = Router();

router.get('/:loadId', matchController.getMatches);
router.post('/:matchId/accept', matchController.acceptMatch);

export default router;
