import { Router } from 'express';
import * as assistantController from '../controllers/assistant.controller';

const router = Router();

router.post('/chat', assistantController.chat);
router.post('/ask-ai', assistantController.askAi);

export default router;
