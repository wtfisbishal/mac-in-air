import { io, Socket } from 'socket.io-client';

const URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    // Get auth token if available
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('rmac_token') ?? undefined
      : undefined;

    socket = io(URL, {
      // Must include 'polling' first so Socket.IO can complete the HTTP upgrade
      // handshake before promoting to WebSocket. Forcing websocket-only breaks
      // the initial connection because there is no HTTP handshake to piggyback on.
      transports: ['polling', 'websocket'],
      upgrade: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
      auth: token ? { token } : undefined,
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });
  }
  return socket;
}

export function destroySocket() {
  socket?.disconnect();
  socket = null;
}
