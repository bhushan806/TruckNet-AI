import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { env } from './env';
import { logger } from '../utils/logger';

let io: Server;

export const initSocket = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
            // SECURITY: Restrict WebSocket CORS to configured frontend origin
            origin: env.CORS_ORIGIN,
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        logger.debug('Socket connected', { socketId: socket.id });

        socket.on('join', (userId) => {
            socket.join(userId);
            logger.debug('User joined room', { userId });
        });

        socket.on('updateLocation', (data) => {
            io.to(data.rideId).emit('locationUpdated', data);
        });

        socket.on('disconnect', () => {
            logger.debug('Socket disconnected', { socketId: socket.id });
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};
