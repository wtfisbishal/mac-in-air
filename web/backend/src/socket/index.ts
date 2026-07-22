
import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { setupDesktopHandlers } from './desktop';
import { setupFrontendHandlers } from './frontend';
import { verifyToken } from '../middleware/auth';
import { serverErrorsTotal, wsConnectionsActive } from '../metrics';
import { loggerInfo, loggerError } from '../logger';

let io: SocketServer;

export function initSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['polling', 'websocket'],
    upgradeTimeout: 15000,
    connectTimeout: 30000,
    pingInterval: 30000,
    pingTimeout: 60000,
    maxHttpBufferSize: 1e7,
    perMessageDeflate: false,
  });

  // Connection handler
  io.on('connection', (socket) => {
    const isDesktop = socket.handshake.query.role === 'desktop';
    const role = isDesktop ? 'desktop' : 'frontend';

    // Require valid JWT for ALL connections (both desktop and frontend)
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      console.warn(`[Socket] No auth token from ${socket.id} (${role}), disconnecting`);
      socket.emit('auth-error', { message: 'Authentication required. Please sign in with Google.' });
      socket.disconnect(true);
      serverErrorsTotal.inc({ type: 'auth_missing' });
      return;
    }

    let userPayload: { userId: string; email: string; name?: string; picture?: string };
    try {
      userPayload = verifyToken(token) as any;
    } catch {
      console.warn(`[Socket] Invalid token from ${socket.id} (${role}), disconnecting`);
      socket.emit('auth-error', { message: 'Invalid or expired token. Please sign in again.' });
      socket.disconnect(true);
      serverErrorsTotal.inc({ type: 'auth_error' });
      loggerError(`[Socket] Invalid token from ${socket.id}, disconnecting`, {
        deviceId: socket.handshake.query.deviceId,
      });
      return;
    }

    wsConnectionsActive.inc({ role });

    console.log(`[Socket] ${isDesktop ? 'Desktop' : 'Frontend'} connected: ${socket.id} (${userPayload.email})`);
    loggerInfo(`[Socket] ${isDesktop ? 'Desktop' : 'Frontend'} connected: ${socket.id}`, {
      deviceId: socket.handshake.query.deviceId as string,
    });

    if (isDesktop) {
      setupDesktopHandlers(io, socket);
    } else {
      // Pass verified email to frontend handlers for per-event access control
      setupFrontendHandlers(io, socket, userPayload.email);
    }
  });

  return io;
}

export function getIo(): SocketServer {
  if (!io) {
    serverErrorsTotal.inc({ type: 'Socket.IO not initialized' });
    loggerError('Socket.IO not initialized');
    throw new Error('Socket.IO not initialized — call initSocket() first');
  }
  return io;
}
