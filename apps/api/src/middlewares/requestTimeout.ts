import { Request, Response, NextFunction } from 'express';

/**
 * Request timeout middleware — aborts requests that exceed the limit.
 * Default: 30 seconds.
 */
export function requestTimeout(timeoutMs: number = 30_000) {
    return (req: Request, res: Response, next: NextFunction) => {
        const timer = setTimeout(() => {
            if (!res.headersSent) {
                res.status(408).json({
                    status: 'error',
                    message: 'Request timed out',
                });
            }
        }, timeoutMs);

        // Clear timer when response finishes
        res.on('finish', () => clearTimeout(timer));
        res.on('close', () => clearTimeout(timer));

        next();
    };
}
