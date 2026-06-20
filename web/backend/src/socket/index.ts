
import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { setupDesktopHandlers } from './desktop';
import { setupFrontendHandlers } from './frontend';
import { verifyToken } from '../middleware/auth';
import { serverErrorsTotal, wsConnectionsActive, } from '../metrics';

let io: SocketServer;

export function initSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    // polling is required for the initial HTTP handshake before upgrading to ws
    transports: ['polling', 'websocket'],
    upgradeTimeout: 15000, // give 15 s for the polling→websocket upgrade
    connectTimeout: 30000, // 30 s to complete the initial handshake
    pingInterval: 30000,  // send a ping every 30 s
    pingTimeout: 60000,   // wait 60 s for pong before considering the socket dead


    maxHttpBufferSize: 1e7,   // 10 MB
    perMessageDeflate: false,

  });

  // Connection handler 
  io.on('connection', (socket) => {
    const isDesktop = socket.handshake.query.role === 'desktop';
    const role = isDesktop ? 'desktop' : 'frontend';

    // Optionally validate JWT for frontend connections
    if (!isDesktop) {
      const token = socket.handshake.auth?.token as string | undefined;
      if (token) {
        try {
          verifyToken(token);
        } catch {
          console.warn(`[Socket] Invalid token from ${socket.id}, disconnecting`);
          socket.disconnect(true);
          serverErrorsTotal.inc({ type: 'auth_error', });
          return;
        }
      }
    }

    //   WebSocket connection metrics  
    wsConnectionsActive.inc({ role });

    // socket.on('keep-alive', () => {
    //   // noop
    // });

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
  if (!io){ 
    serverErrorsTotal.inc({ type: 'Socket.IO not initialized ', });
    throw new Error('Socket.IO not initialized — call initSocket() first');
  }
  return io;
}
