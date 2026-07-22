import { Server as SocketServer, Socket } from 'socket.io';
import { deviceManager } from '../managers/devices';
import {
  wsWebRtcEventsTotal,
  wsConnectionsActive,
  serverErrorsTotal,
  wsDisconnectionsTotal,
} from '../metrics';
import { loggerError } from '../logger';

export function setupDesktopHandlers(io: SocketServer, socket: Socket): void {

  // device-online: desktop announces itself with its authenticated owner email
  socket.on('device-online', (data: {
    deviceId: string;
    name: string;
    platform: string;
    arch: string;
    user: string;
    ownerEmail: string; // authenticated Google email
    masterSalt?: string;
    pairingChallenge?: string;
    display: {
      width: number;
      height: number;
      scaleFactor: number;
    };
  }, ack?: () => void) => {

    const { deviceId, name, platform, arch, user, ownerEmail, display } = data;

    if (!deviceId) {
      console.warn('[Desktop] device-online missing deviceId');
      ack?.();
      return;
    }

    if (!ownerEmail) {
      console.warn('[Desktop] device-online missing ownerEmail — rejecting');
      ack?.();
      return;
    }

    const device = deviceManager.registerDevice(deviceId, {
      name: name || 'Unknown',
      platform: platform || 'unknown',
      arch: arch || 'unknown',
      socketId: socket.id,
      user: user || '',
      ownerEmail,
      masterSalt: data.masterSalt,
      pairingChallenge: data.pairingChallenge,
      display: display || { width: 1920, height: 1080, scaleFactor: 1 },
    });

    // Join the device's own room so we can target it by deviceId
    socket.join(deviceId);

    // Broadcast device status to all connected frontends (they will filter by email)
    io.emit('device-status-changed', { deviceId: device.id, isOnline: true, ownerEmail });

    console.log(`[Desktop] device-online: ${deviceId} (owner: ${ownerEmail}, socket: ${socket.id})`);

    // Acknowledge so desktop knows registration was successful
    ack?.();
  });

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
    if (!candidate) {
      console.warn(`[Backend] Missing ICE candidate from desktop ${socket.id}`);
      return;
    }
    if (candidate.sdpMid == null && candidate.sdpMLineIndex == null) {
      console.warn(`[Backend] Invalid ICE candidate from desktop ${socket.id}`);
      return;
    }
    const device = deviceManager.getDeviceBySocketId(socket.id);
    if (!device) return;
    socket.to(device.id).emit('webrtc-ice-candidate', data);
  });

  socket.on('disconnect', (reason) => {
    console.log(`[Desktop] Disconnected: ${socket.id} (reason: ${reason})`);
    wsDisconnectionsTotal.inc({ role: 'desktop', reason });

    const device = deviceManager.getDeviceBySocketId(socket.id);
    if (!device) return;

    setTimeout(() => {
      const current = deviceManager.getDevice(device.id);
      if (current && current.socketId === socket.id && !io.sockets.sockets.has(socket.id)) {
        deviceManager.markOffline(socket.id);
        io.emit('device-status-changed', { deviceId: device.id, isOnline: false, ownerEmail: device.ownerEmail });
        io.to(device.id).emit('device-disconnected', { deviceId: device.id });
        wsConnectionsActive.dec({ role: 'desktop' });
      }
    }, 100);
  });

  // keep-alive — desktop sends this every ~25 s to prevent Render's idle timeout
  socket.on('keep-alive', () => {
    socket.emit('keep-alive-ack');
  });
}
