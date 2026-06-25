import { Server as SocketServer, Socket } from 'socket.io';
import { deviceManager } from '../managers/devices';
import { pairingManager } from '../managers/pairing';
import {
  wsFrameBytesHistogram,
  wsWebRtcEventsTotal,
  wsConnectionsActive,
  serverErrorsTotal,
  wsDisconnectionsTotal,
} from '../metrics';
import { loggerError } from '../logger';

export function setupDesktopHandlers(io: SocketServer, socket: Socket): void {

  socket.on('device-online', (data:
    {
      deviceId: string; name: string; platform: string; arch: string, user: string,

      display: {
        width: number,
        height: number,
        scaleFactor: number
      }
    }, ack?: () => void) => {

    const { deviceId, name, platform, arch, user, display } = data;

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
      user: user || '',
      display: display || ''
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
        serverErrorsTotal.inc({ type: 'pairing_error', });
        loggerError('Error generating pairing code', {
          error: err instanceof Error ? err.message : String(err),
          deviceId,
        });
        callback({ success: false, error: err.message });
      }
    }
  );

  // Desktop agent confirms screen share has started.
  socket.on('screen-share-started', (data: { sessionId: string; success: boolean }) => {

    const device = deviceManager.getDeviceBySocketId(socket.id);
    if (!device) return;
    socket.to(device.id).emit('screen-share-started', data);

  });

  // Desktop agent emits command result (non-callback style).
  socket.on('command-result', (result: unknown) => {
    const device = deviceManager.getDeviceBySocketId(socket.id);
    if (!device) return;
    socket.to(device.id).emit('command-result', result);
  });

  // WebRTC relay — desktop → frontend
  socket.on('webrtc-offer', (data: any) => {
    wsWebRtcEventsTotal.inc({ signal_type: 'offer', direction: 'desktop→frontend' });

    console.log(`[Backend] webrtc-offer received from desktop ${socket.id}`);
    const device = deviceManager.getDeviceBySocketId(socket.id);
    if (!device) return;

    socket.to(device.id).emit('webrtc-offer', data);

  });

  socket.on('webrtc-answer', (data: any) => {

    wsWebRtcEventsTotal.inc({ signal_type: 'answer', direction: 'desktop→frontend' });

    console.log(`[Backend] webrtc-answer received from desktop ${socket.id} (unusual)`);
    const device = deviceManager.getDeviceBySocketId(socket.id);
    if (!device) return;

    socket.to(device.id).emit('webrtc-answer', data);

  });

  socket.on('webrtc-ice-candidate', (data: any) => {

    wsWebRtcEventsTotal.inc({ signal_type: 'ice', direction: 'desktop→frontend' });

    const candidate = data?.candidate;
    // missing candidate
    if (!candidate) {
      console.warn(`[Backend] Missing ICE candidate from desktop ${socket.id}`);
      return;
    }
    // malformed candidate
    if (candidate.sdpMid == null && candidate.sdpMLineIndex == null) {
      console.warn(`[Backend] Invalid ICE candidate from desktop ${socket.id}`);
      return;
    }

    // console.log(`[Backend] webrtc-ice-candidate received from desktop ${socket.id}`);
    const device = deviceManager.getDeviceBySocketId(socket.id);
    if (!device) return;

    socket.to(device.id).emit('webrtc-ice-candidate', data);

  });

  socket.on('disconnect', (reason) => {
    console.log(`[Desktop] Disconnected: ${socket.id} (reason: ${reason})`);

    wsDisconnectionsTotal.inc({ role: 'desktop', reason, });

    const device = deviceManager.getDeviceBySocketId(socket.id);
    if (!device) return;

    setTimeout(() => {
      const current = deviceManager.getDevice(device.id);

      if (current && current.socketId === socket.id && !io.sockets.sockets.has(socket.id)) {
        deviceManager.markOffline(socket.id);
        io.emit('device-status-changed', { deviceId: device.id, isOnline: false });
        io.to(device.id).emit('device-disconnected', { deviceId: device.id });
        wsConnectionsActive.dec({ role: 'desktop' });
      }


    }, 30000);
  });

  // keep-alive — desktop sends this every ~25 s to prevent Render's idle timeout
  socket.on('keep-alive', () => {
    // Silently ack — just receiving the event is enough to reset the idle timer
    socket.emit('keep-alive-ack');
  });
}
