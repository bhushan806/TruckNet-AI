// ── Express Request Type Augmentation ──
// Extends Express.Request to include the authenticated user payload
// decoded from the JWT cookie by auth.middleware.ts.
// Shape matches the JWT sign payload in auth.service.ts.

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                phone: string;
                role: 'CUSTOMER' | 'OWNER' | 'DRIVER' | 'ADMIN';
            };
        }
    }
}

export {};
