// ── Express Request Type Augmentation ──
// Extends Express.Request to include the authenticated user payload
// decoded from the JWT cookie by auth.middleware.ts.
// Shape matches the JWT sign payload in auth.service.ts.

import { AuthenticatedUser } from '../middlewares/auth.middleware';

declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}

export {};
