// ── Unified Socket.io Client for TruckNet Web ──
// Safely derives root server URL from NEXT_PUBLIC_API_URL, attaches JWT auth,
// and manages reconnection with exponential backoff.

import { io, Socket } from 'socket.io-client';

export function getSocketUrl(): string {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    // Strip trailing '/api' or '/'
    return apiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '') || 'http://localhost:5000';
}

export function createSocket(): Socket {
    const socketUrl = getSocketUrl();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

    return io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
    });
}
