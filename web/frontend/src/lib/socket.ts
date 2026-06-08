import { io, Socket } from 'socket.io-client';

const URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(URL, {
      transports: ['polling', 'websocket'],
      reconnectionDelayMax: 10000,
    });
  }
  return socket;
}

export function destroySocket() {
  socket?.disconnect();
  socket = null;
}
