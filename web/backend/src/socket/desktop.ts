import { Server as SocketServer, Socket } from 'socket.io';
import { deviceManager } from '../managers/devices';
import { pairingManager } from '../managers/pairing';
import { roomManager } from '../managers/rooms';

export function setupDesktopHandlers(io: SocketServer, socket: Socket): void {
  // device-online 
 
  socket.on(
    'device-online',
    (
      data: { deviceId: string; name: string; platform: string; arch: string ,user:string},
      ack?: () => void
    ) => {
      const { deviceId, name, platform, arch ,user} = data;

      if (!deviceId) {
        console.warn('[Desktop] device-online missing deviceId');
        ack?.();
        return;
      }

      const device = deviceManager.registerDevice(deviceId, {
        name: name || 'Unknown',
        platform: platform || 'unknown',
        arch: arch || 'unknown',
        socketId: socket.id,
        user: user || ''
      });
 

      // Join the device's own room so we can target it by deviceId
      socket.join(deviceId);

      // Broadcast device status to all connected frontends
      io.emit('device-status-changed', { deviceId: device.id, isOnline: true });

      console.log(`[Desktop] device-online: ${deviceId} (socket: ${socket.id})`);

      // Acknowledge so desktop can safely request pairing code next
      ack?.();
    }
  );

  // request-pairing-code
  // Desktop agent requests (or refreshes) its pairing code.
  socket.on(
    'request-pairing-code',
    (data: { deviceId: string }, callback: (res: { success: boolean; code?: string; error?: string }) => void) => {
      const { deviceId } = data;

      if (!deviceId) {
        callback({ success: false, error: 'deviceId is required' });
        return;
      }

      try {
        const code = pairingManager.createCode(deviceId, socket.id);
        callback({ success: true, code });
        console.log(`[Desktop] Pairing code issued: ${code} → ${deviceId}`);
      } catch (err: any) {
        callback({ success: false, error: err.message });
      }
    }
  );

  //   screen-frame 
  // Desktop agent sends a raw screen frame; relay to all paired frontends.
  socket.on(
    'screen-frame',
    (data: { sessionId: string; frame: Buffer | string; width: number; height: number }) => {
      // Find which device this socket belongs to
      const device = deviceManager.getDeviceBySocketId(socket.id);
      if (!device) return;

      // Forward to all frontends in this device's room
      const frontendSocketIds = roomManager.getSocketsForDevice(device.id);
      for (const fid of frontendSocketIds) {
        const frontendSocket = io.sockets.sockets.get(fid);
        if (frontendSocket) {
          frontendSocket.emit('screen-frame', data);
        }
      }
    }
  );

  //   screen-share-started
  // Desktop agent confirms screen share has started.
  socket.on('screen-share-started', (data: { sessionId: string; success: boolean }) => {
    const device = deviceManager.getDeviceBySocketId(socket.id);
    if (!device) return;

    // Notify all paired frontends
    const frontendSocketIds = roomManager.getSocketsForDevice(device.id);
    for (const fid of frontendSocketIds) {
      const frontendSocket = io.sockets.sockets.get(fid);
      if (frontendSocket) {
        frontendSocket.emit('screen-share-started', data);
      }
    }
  });

  //   command-result 
  // Desktop agent emits command result (non-callback style).
  socket.on('command-result', (result: unknown) => {
    const device = deviceManager.getDeviceBySocketId(socket.id);
    if (!device) return;

    const frontendSocketIds = roomManager.getSocketsForDevice(device.id);
    for (const fid of frontendSocketIds) {
      const frontendSocket = io.sockets.sockets.get(fid);
      if (frontendSocket) {
        frontendSocket.emit('command-result', result);
      }
    }
  });

  //   disconnect 
  socket.on('disconnect', (reason) => {
    console.log(`[Desktop] Disconnected: ${socket.id} (reason: ${reason})`);

    const device = deviceManager.markOffline(socket.id);
    if (device) {
      // Revoke pairing codes
      pairingManager.revokeDevice(device.id);

      // Notify frontends
      io.emit('device-status-changed', { deviceId: device.id, isOnline: false });

      // Notify paired frontends that their session ended
      const frontendSocketIds = roomManager.getSocketsForDevice(device.id);
      for (const fid of frontendSocketIds) {
        const frontendSocket = io.sockets.sockets.get(fid);
        if (frontendSocket) {
          frontendSocket.emit('device-disconnected', { deviceId: device.id });
        }
        roomManager.leave(fid);
      }
    }
  });
}
