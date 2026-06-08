
import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { setupDesktopHandlers } from './desktop';
import { setupFrontendHandlers } from './frontend';
import { verifyToken } from '../middleware/auth';

let io: SocketServer;

// Exported so routes can access the io instance.

export function initSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    // Allow both polling and websocket
    transports: ['polling', 'websocket'],
  });

  // Connection handler 
  io.on('connection', (socket) => {
    const isDesktop = socket.handshake.query.role === 'desktop';

    // Optionally validate JWT for frontend connections
    if (!isDesktop) {
      const token = socket.handshake.auth?.token as string | undefined;
      if (token) {
        try {
          verifyToken(token);
        } catch {
          console.warn(`[Socket] Invalid token from ${socket.id}, disconnecting`);
          socket.disconnect(true);
          return;
        }
      }
    }

    console.log(`[Socket] ${isDesktop ? 'Desktop' : 'Frontend'} connected: ${socket.id}`);

    if (isDesktop) {
      setupDesktopHandlers(io, socket);
    } else {
      setupFrontendHandlers(io, socket);
    }
  });
 
  return io;
}

export function getIo(): SocketServer {
  if (!io) throw new Error('Socket.IO not initialized — call initSocket() first');
  return io;
}
