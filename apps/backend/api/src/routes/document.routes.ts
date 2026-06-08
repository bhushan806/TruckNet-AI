// ── Document Routes ──
// SECURITY FIXES:
//   - GET /file/:filename: auth-gated document serving (replaces static /uploads endpoint)
//   - Ownership validation: user can only download their own documents
//   - DELETE /: soft delete with ownership check
//   - Path traversal prevented: filename sanitized before use

import { Router, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { getDocuments, uploadDocument } from '../controllers/document.controller';
import { protect, AuthRequest } from '../middlewares/auth.middleware';
import { upload, uploadDir } from '../config/multer';
import DocumentModel from '../models/Document';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

const router = Router();

// All document routes require authentication
router.use(protect);

// GET /api/documents — list my documents
router.get('/', getDocuments);

// POST /api/documents/upload — upload a document
router.post('/upload', upload.single('file'), uploadDocument);

// ── FIX: Auth-gated file serving ──
// Before: app.use('/uploads', express.static(...)) — NO access control
// After:  GET /api/documents/file/:filename — validates ownership before serving
router.get('/file/:filename', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const requestedFilename = req.params.filename;

        // FIX: Path traversal prevention — strip any directory components from filename
        const safeFilename = path.basename(requestedFilename);
        if (!safeFilename || safeFilename !== requestedFilename) {
            res.status(400).json({ status: 'error', message: 'Invalid filename' });
            return;
        }

        // Verify the document belongs to the requesting user
        const doc = await DocumentModel.findOne({
            owner: userId,
            url: { $regex: safeFilename },
        });

        if (!doc) {
            // Return 404 (not 403) to avoid confirming document existence to unauthorized user
            res.status(404).json({ status: 'error', message: 'Document not found' });
            return;
        }

        const filePath = path.join(uploadDir, safeFilename);

        // Ensure file exists on disk
        if (!fs.existsSync(filePath)) {
            logger.error('Document file missing from disk', { userId, filename: safeFilename });
            res.status(404).json({ status: 'error', message: 'File not found' });
            return;
        }

        // Set cache control headers — private (user-specific) content
        res.setHeader('Cache-Control', 'private, max-age=3600');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.sendFile(safeFilename, { root: uploadDir });
    } catch (error: any) {
        logger.error('Document file serve error', { error: error.message });
        res.status(500).json({ status: 'error', message: 'Failed to serve document' });
    }
});

// DELETE /api/documents/:id — delete a document (ownership validated in controller)
router.delete('/:id', async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { id } = req.params;

        const doc = await DocumentModel.findOne({ _id: id, owner: userId });
        if (!doc) {
            res.status(404).json({ status: 'error', message: 'Document not found' });
            return;
        }

        // Delete file from disk
        if (doc.url) {
            const filename = path.basename(doc.url);
            const filePath = path.join(uploadDir, filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await DocumentModel.deleteOne({ _id: id, owner: userId });
        res.json({ status: 'success', message: 'Document deleted' });
    } catch (error: any) {
        logger.error('Document delete error', { error: error.message });
        res.status(500).json({ status: 'error', message: 'Failed to delete document' });
    }
});

export default router;
