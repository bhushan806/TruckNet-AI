// ── Socket.io Configuration ──
// SECURITY FIXES:
//   - C-8: JWT authentication required on every WebSocket connection
//   - Users auto-join their own room only (identity from JWT, not client claim)
//   - Location updates validated: driverId always comes from server, not client
//   - CORS restricted to configured origin allowlist
//   - Rate limiting on socket events (10 location updates/min per socket)

import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { env } from './env';
import { logger } from '../utils/logger';

let io: Server;

// ── Per-socket event rate limiter ──
const socketRateLimits = new Map<string, { count: number; resetAt: number }>();

function checkSocketRateLimit(socketId: string, limit = 10, windowMs = 60_000): boolean {
    const now = Date.now();
    const entry = socketRateLimits.get(socketId);

    if (!entry || entry.resetAt <= now) {
        socketRateLimits.set(socketId, { count: 1, resetAt: now + windowMs });
        return true; // Allow
    }

    entry.count++;
    if (entry.count > limit) {
        return false; // Deny
    }
    return true; // Allow
}

// Cleanup stale rate limit entries every 5 min
setInterval(() => {
    const now = Date.now();
    for (const [id, entry] of socketRateLimits.entries()) {
        if (entry.resetAt <= now) socketRateLimits.delete(id);
    }
}, 5 * 60 * 1000);

export const initSocket = (httpServer: HttpServer) => {
    // CORS allowlist from environment
    const corsOrigins = (env.CORS_ORIGIN || '')
        .split(',')
        .map(o => o.trim())
        .filter(Boolean);

    if (env.NODE_ENV !== 'production') {
        corsOrigins.push('http://localhost:3000', 'http://localhost:3001');
    }

    io = new Server(httpServer, {
        cors: {
            origin: corsOrigins,
            methods: ['GET', 'POST'],
            credentials: true,
        },
        // Enforce connection limits
        connectTimeout: 10_000,
        pingTimeout: 20_000,
        pingInterval: 25_000,
    });

    // ── FIX C-8: JWT Authentication Middleware ──
    // Every socket connection MUST present a valid JWT — no anonymous connections
    io.use((socket, next) => {
        // Try handshake auth object (modern clients) first, then Authorization header
        let rawToken =
            socket.handshake.auth?.token ||
            socket.handshake.headers?.authorization?.replace('Bearer ', '');

        // Fallback to HTTP-only cookie if no explicit token is provided
        if (!rawToken && socket.handshake.headers.cookie) {
            const cookies = socket.handshake.headers.cookie.split(';').reduce((res: any, item: string) => {
                const data = item.trim().split('=');
                if (data.length === 2) {
                    res[data[0]] = data[1];
                }
                return res;
            }, {});
            rawToken = cookies.access_token;
        }

        if (!rawToken) {
            logger.warn('Socket connection rejected: no token', { socketId: socket.id });
            return next(new Error('Authentication required: no token provided'));
        }

        try {
            const decoded = jwt.verify(rawToken, env.JWT_SECRET) as { userId: string };
            if (!decoded.userId) {
                return next(new Error('Invalid token: missing userId'));
            }
            // Attach verified userId to socket — this is the source of truth for identity
            (socket as any).userId = decoded.userId;
            logger.debug('Socket authenticated', { socketId: socket.id, userId: decoded.userId });
            next();
        } catch (err: any) {
            logger.warn('Socket connection rejected: invalid token', {
                socketId: socket.id,
                error: err.message,
            });
            next(new Error('Authentication failed: invalid or expired token'));
        }
    });

    io.on('connection', (socket) => {
        const authenticatedUserId: string = (socket as any).userId;
        logger.debug('Socket connected', { socketId: socket.id, userId: authenticatedUserId });

        // ── Auto-join user's own room (server-controlled, not client-controlled) ──
        socket.join(authenticatedUserId);
        logger.debug('User joined own room', { userId: authenticatedUserId });

        // ── FIX: 'join' event no longer accepts a userId — server manages rooms ──
        // Before: socket.on('join', (userId) => socket.join(userId)) — room hijacking risk
        // After: identity is from JWT, cannot be claimed by client
        socket.on('join', () => {
            // No-op: room is already joined from JWT identity above
            // Kept for backward compatibility — client can call this safely
        });

        // ── Location Update — Rate limited + identity enforced ──
        socket.on('updateLocation', (data: { rideId: string; lat?: number; lng?: number }) => {
            // Rate limit: 10 location updates per minute per socket
            if (!checkSocketRateLimit(socket.id, 10)) {
                socket.emit('error', { message: 'Rate limit exceeded for location updates' });
                return;
            }

            if (!data?.rideId) {
                socket.emit('error', { message: 'rideId is required for location updates' });
                return;
            }

            // FIX: driverId always comes from the JWT-verified userId, never from client data
            io.to(data.rideId).emit('locationUpdated', {
                rideId: data.rideId,
                driverId: authenticatedUserId, // Server-authoritative identity
                lat: data.lat,
                lng: data.lng,
                timestamp: new Date().toISOString(),
            });
        });

        // ── Join a specific ride room (validated) ──
        socket.on('joinRide', (rideId: string) => {
            if (!rideId || typeof rideId !== 'string' || rideId.length > 100) {
                socket.emit('error', { message: 'Invalid rideId' });
                return;
            }
            socket.join(rideId);
            logger.debug('User joined ride room', { userId: authenticatedUserId, rideId });
        });

        socket.on('disconnect', (reason) => {
            socketRateLimits.delete(socket.id);
            logger.debug('Socket disconnected', {
                socketId: socket.id,
                userId: authenticatedUserId,
                reason,
            });
        });

        socket.on('error', (err) => {
            logger.error('Socket error', { socketId: socket.id, error: err.message });
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) throw new Error('Socket.io not initialized!');
    return io;
};
