import express from 'express';
import { protect } from '../middlewares/auth.middleware';
import * as requestController from '../controllers/request.controller';

const router = express.Router();

router.post('/send', protect, requestController.sendRequest);
router.get('/driver', protect, requestController.getDriverRequests);
router.post('/:id/respond', protect, requestController.respondToRequest);

export default router;
