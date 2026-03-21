import { Router } from 'express';
import { getDocuments, uploadDocument } from '../controllers/document.controller';
import { protect } from '../middlewares/auth.middleware';
import { upload } from '../config/multer';

const router = Router();

router.use(protect);

router.get('/', getDocuments);
router.post('/upload', upload.single('file'), uploadDocument);

export default router;
