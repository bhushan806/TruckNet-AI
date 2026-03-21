import { Router } from 'express';
import { getFinanceOverview, addTransaction } from '../controllers/finance.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect); // Require Login

router.get('/', getFinanceOverview);
router.post('/', addTransaction);

export default router;
