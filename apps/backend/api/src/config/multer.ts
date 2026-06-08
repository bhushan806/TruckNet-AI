// ── Multer Configuration ──
// SECURITY FIXES:
//   - File extension extracted from originalname using path.extname only for naming
//   - Filenames are now UUID-based (no user-controlled content in filename)
//   - MIME type allowed list is explicit (not startsWith('image/') — too broad)
//   - File size limit: 5MB (unchanged — appropriate)
//   - Storage location outside the webroot (not served statically)
//   - NOTE: Production should use S3/GCS instead of local disk storage

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Ensure uploads directory exists (outside webroot — never served statically)
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// ── Allowed MIME types (explicit allowlist, not startsWith pattern) ──
const ALLOWED_MIME_TYPES: ReadonlySet<string> = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
]);

// ── Safe file extensions per MIME type ──
const MIME_TO_EXT: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'application/pdf': '.pdf',
};

// ── Disk Storage ──
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        // FIX: Filename is now a UUID + safe extension derived from MIME type
        // Never use user-controlled originalname in filename — path traversal risk
        const uuid = crypto.randomUUID();
        const safeExt = MIME_TO_EXT[file.mimetype] || '.bin';
        cb(null, `${uuid}${safeExt}`);
    },
});

// ── File Filter (validates MIME type from Content-Type header) ──
// NOTE: Content-Type can be spoofed. For full security, also validate magic bytes
// in the document controller using the 'file-type' npm package after upload.
const fileFilter = (
    _req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`File type '${file.mimetype}' is not allowed. Only JPEG, PNG, WebP, and PDF files are accepted.`));
    }
};

export const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 1,                   // Max 1 file per request
        fields: 10,                 // Max 10 non-file fields
    },
    fileFilter,
});

export { uploadDir };
