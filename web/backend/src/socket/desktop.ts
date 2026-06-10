import { Server as SocketServer, Socket } from 'socket.io';
import { deviceManager } from '../managers/devices';
import { pairingManager } from '../managers/pairing';
import { roomManager } from '../managers/rooms';

export function setupDesktopHandlers(io: SocketServer, socket: Socket): void {
  socket.on('device-online',
    (
      data: { deviceId: string; name: string; platform: string; arch: string, user: string },
      ack?: () => void
    ) => {
      const { deviceId, name, platform, arch, user } = data;

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

  // Desktop agent requests (or refreshes) its pairing code.
  socket.on('request-pairing-code',
    (data: { deviceId: string; forceRefresh?: boolean }, callback: (res: { success: boolean; code?: string; error?: string }) => void) => {

      const { deviceId, forceRefresh } = data;

      if (!deviceId) {
        callback({ success: false, error: 'deviceId is required' });
        return;
      }

      try {
        let code = pairingManager.getCodeForDevice(deviceId);
        if (!code || forceRefresh) {
          code = pairingManager.createCode(deviceId, socket.id);
          console.log(`[Desktop] New pairing code issued: ${code} → ${deviceId}`);
        } else {
          console.log(`[Desktop] Reused existing pairing code: ${code} → ${deviceId}`);
        }
        callback({ success: true, code });
      } catch (err: any) {
        callback({ success: false, error: err.message });
      }
    }
  );

  // Desktop agent sends a raw screen frame; relay to all paired frontends.
  socket.on('screen-frame',
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

  //   webrtc relay
  socket.on('webrtc-offer', (data: any) => {
    console.log(`[Backend] webrtc-offer received from desktop ${socket.id}`);
    const device = deviceManager.getDeviceBySocketId(socket.id);
    if (!device) return;
    const frontendSocketIds = roomManager.getSocketsForDevice(device.id);
    console.log(`[Backend] relaying webrtc-offer to ${frontendSocketIds.length} frontends`);
    for (const fid of frontendSocketIds) {
      const frontendSocket = io.sockets.sockets.get(fid);
      if (frontendSocket) {
        frontendSocket.emit('webrtc-offer', data);
      }
    }
  });

  socket.on('webrtc-answer', (data: any) => {
    console.log(`[Backend] webrtc-answer received from desktop ${socket.id} (unusual)`);
    // Answer is usually sent FROM frontend, so this might not be needed here,
    // but just in case, we relay it the same way.
    const device = deviceManager.getDeviceBySocketId(socket.id);
    if (!device) return;
    const frontendSocketIds = roomManager.getSocketsForDevice(device.id);
    for (const fid of frontendSocketIds) {
      const frontendSocket = io.sockets.sockets.get(fid);
      if (frontendSocket) {
        frontendSocket.emit('webrtc-answer', data);
      }
    }
  });

  socket.on('webrtc-ice-candidate', (data: any) => {
    console.log(`[Backend] webrtc-ice-candidate received from desktop ${socket.id}`);
    const device = deviceManager.getDeviceBySocketId(socket.id);
    if (!device) return;
    const frontendSocketIds = roomManager.getSocketsForDevice(device.id);
    for (const fid of frontendSocketIds) {
      const frontendSocket = io.sockets.sockets.get(fid);
      if (frontendSocket) {
        frontendSocket.emit('webrtc-ice-candidate', data);
      }
    }
  });


  socket.on('disconnect', (reason) => {
    console.log(`[Desktop] Disconnected: ${socket.id} (reason: ${reason})`);

    const device = deviceManager.getDeviceBySocketId(socket.id);

    if (!device) return;

    setTimeout(() => {
      const current = deviceManager.getDevice(device.id);

      if (
        current &&
        current.socketId === socket.id &&
        !io.sockets.sockets.has(socket.id)
      ) {
        deviceManager.markOffline(socket.id);

        io.emit('device-status-changed', {
          deviceId: device.id,
          isOnline: false,
        });
      }
      // Notify paired frontends that their session ended
      const frontendSocketIds = roomManager.getSocketsForDevice(device.id);
      for (const fid of frontendSocketIds) {
        const frontendSocket = io.sockets.sockets.get(fid);
        if (frontendSocket) {
          frontendSocket.emit('device-disconnected', { deviceId: device.id });
        }
        roomManager.leave(fid);
      }

    }, 30000);
  });

  // keep-alive — desktop sends this every ~25 s to prevent Render's idle timeout
  socket.on('keep-alive', () => {
    // Silently ack — just receiving the event is enough to reset the idle timer
    socket.emit('keep-alive-ack');
  });
}
