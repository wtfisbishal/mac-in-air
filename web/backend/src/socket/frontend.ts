import { Server as SocketServer, Socket } from 'socket.io';
import { deviceManager } from '../managers/devices';
import { roomManager } from '../managers/rooms';
import { CommandPayload } from '../types';
import { wsWebRtcEventsTotal, wsConnectionsActive, serverErrorsTotal, wsDisconnectionsTotal } from '../metrics';
import { loggerInfo, loggerError } from '../logger';

type IceCandidatePayload = {
  candidate?: {
    candidate?: string;
    sdpMid?: string | null;
    sdpMLineIndex?: number | null;
  };
  deviceId: string;
};

export function setupFrontendHandlers(io: SocketServer, socket: Socket, userEmail: string): void {

  // join-device — Frontend joins the device's control room.
  // SECURITY: JWT email must match the device's ownerEmail. No pairing codes needed.
  socket.on('join-device',
    (data: { deviceId: string; pairToken?: string }, callback?: (res: { success: boolean; message?: string }) => void) => {

      const { deviceId, pairToken } = data;

      const device = deviceManager.getDevice(deviceId);
      if (!device) {
        callback?.({ success: false, message: 'Device not found' });
        return;
      }

      // Security check: frontend user must own this device
      if (device.ownerEmail !== userEmail) {
        console.warn(`[Frontend] join-device rejected: email mismatch (socket ${socket.id})`);
        callback?.({ success: false, message: 'Access denied: this device does not belong to your account.' });
        return;
      }

      if (!device.isOnline) {
        callback?.({ success: false, message: 'Device is offline' });
        return;
      }

      // Security check: If device has a master key, a valid pairToken is required
      if (device.pairingChallenge) {
        if (!pairToken) {
          callback?.({ success: false, message: 'Master Key verification required' });
          return;
        }
        
        import('../managers/pairTokens').then(({ pairTokenManager }) => {
          const valid = pairTokenManager.validateToken(pairToken);
          if (!valid || valid.deviceId !== deviceId) {
             callback?.({ success: false, message: 'Invalid or expired pair token' });
             return;
          }
          
          proceedWithJoin();
        });
        return;
      }

      proceedWithJoin();

      function proceedWithJoin() {
        roomManager.join(deviceId, socket.id);
        deviceManager.addPairedRoom(deviceId, socket.id);
        socket.join(deviceId);

        console.log(`[Frontend] ${socket.id} (${userEmail}) joined device room: ${deviceId}`);

        // Notify the desktop agent that a web client connected
        const desktopSocket = io.sockets.sockets.get(device!.socketId);
        if (desktopSocket) {
          desktopSocket.emit('web-client-connected', {
            socketId: socket.id,
            connectedAt: Date.now(),
          });
        }

        callback?.({ success: true });
      }
    }
  );

  // Routes any typed command to the desktop agent.
  socket.on('command', async (command: CommandPayload, callback?: (res: unknown) => void) => {
    const deviceId = roomManager.getDeviceForSocket(socket.id);
    if (!deviceId) {
      callback?.({ success: false, message: 'Not in a device room. Join a device first.' });
      return;
    }

    const device = deviceManager.getDevice(deviceId);
    if (!device || !device.isOnline) {
      callback?.({ success: false, message: 'Device offline' });
      return;
    }

    // Additional security: re-verify ownership on every command
    if (device.ownerEmail !== userEmail) {
      callback?.({ success: false, message: 'Access denied' });
      return;
    }

    const desktopSocket = io.sockets.sockets.get(device.socketId);
    if (!desktopSocket) {
      callback?.({ success: false, message: 'Desktop agent not connected' });
      return;
    }

    console.log(`[Frontend] → Desktop [${deviceId}] command: ${command.type}`);
    const commandWithSender = { ...command, fromSocketId: socket.id };
    
    if (callback) {
      desktopSocket.timeout(10000).emit('command', commandWithSender, (_err: Error | null, result: unknown) => {
        callback(result ?? { success: false, message: 'No response' });
      });
    } else {
      desktopSocket.emit('command', commandWithSender);
    }
  });

  // Open App
  socket.on('open-app', (data: { app: string }, callback?: (res: unknown) => void) => {
    relayToDesktop(io, socket, userEmail, { type: 'OPEN_APP', payload: data }, callback);
  });

  // System Commands
  socket.on('system-command', (data: { action: 'SHUTDOWN' | 'RESTART' | 'SLEEP' | 'LOCK_SCREEN' }, callback?: (res: unknown) => void) => {
    relayToDesktop(io, socket, userEmail, { type: data.action }, callback);
  });

  // Screen Share Start
  socket.on('screen-share-start', (data: { sessionId: string; frameRate?: number; quality?: number }) => {
    const deviceId = roomManager.getDeviceForSocket(socket.id);
    if (!deviceId) return;

    const device = deviceManager.getDevice(deviceId);
    if (!device?.isOnline) return;
    if (device.ownerEmail !== userEmail) return;

    const desktopSocket = io.sockets.sockets.get(device.socketId);
    if (desktopSocket) {
      desktopSocket.emit('screen-share-request', data);
    }

    console.log(`[Frontend] Screen share requested for device ${deviceId}`);
    loggerInfo(`[Frontend] Screen share requested for device ${deviceId}`);
  });

  // Screen Share Stop
  socket.on('screen-share-stop', (data: { sessionId: string }) => {
    const deviceId = roomManager.getDeviceForSocket(socket.id);
    if (!deviceId) return;

    const device = deviceManager.getDevice(deviceId);
    if (!device?.isOnline) return;
    if (device.ownerEmail !== userEmail) return;

    const desktopSocket = io.sockets.sockets.get(device.socketId);
    if (desktopSocket) {
      desktopSocket?.emit('screen-share-stop', data);
    }
  });

  // WebRTC Signaling relay — frontend → desktop
  socket.on('webrtc-offer', (data: { sdp: unknown; deviceId: string }) => {
    wsWebRtcEventsTotal.inc({ signal_type: 'offer', direction: 'frontend→desktop' });
    console.log(`[Backend] webrtc-offer received from frontend ${socket.id} to device ${data.deviceId}`);
    loggerInfo(`[Backend] webrtc-offer received from frontend ${socket.id} to device ${data.deviceId}`, { deviceId: data.deviceId });

    const device = deviceManager.getDevice(data.deviceId);
    if (!device?.isOnline) return;
    if (device.ownerEmail !== userEmail) return;
    const desktopSocket = io.sockets.sockets.get(device.socketId);
    if (desktopSocket) {
      desktopSocket?.emit('webrtc-offer', { ...data, fromSocketId: socket.id });
    }
  });

  socket.on('webrtc-ice-candidate', (data: IceCandidatePayload) => {
    const candidate = data?.candidate;
    if (!candidate) {
      console.warn('[Backend] Missing ICE candidate');
      return;
    }
    if (candidate.sdpMid == null && candidate.sdpMLineIndex == null) {
      console.warn('[Backend] Invalid ICE candidate');
      return;
    }

    wsWebRtcEventsTotal.inc({ signal_type: 'ice_candidate', direction: 'frontend→desktop' });
    console.log(`[Backend] webrtc-ice-candidate received from frontend ${socket.id}`);

    const device = deviceManager.getDevice(data.deviceId);
    if (!device?.isOnline) return;
    if (device.ownerEmail !== userEmail) return;

    const desktopSocket = io.sockets.sockets.get(device.socketId);
    if (!desktopSocket) return;
    desktopSocket.emit('webrtc-ice-candidate', { ...data, fromSocketId: socket.id });
  });

  socket.on('webrtc-answer', (data: { sdp: unknown; deviceId: string }) => {
    console.log(`[Backend] webrtc-answer received from frontend ${socket.id}`);
    loggerInfo(`[Backend] webrtc-answer received from frontend ${socket.id}`, { deviceId: data.deviceId });

    const device = deviceManager.getDevice(data.deviceId);
    if (!device?.isOnline) return;
    if (device.ownerEmail !== userEmail) return;
    const desktopSocket = io.sockets.sockets.get(device.socketId);
    desktopSocket?.emit('webrtc-answer', { ...data, fromSocketId: socket.id });

    wsWebRtcEventsTotal.inc({ signal_type: 'answer', direction: 'frontend→desktop' });
  });

  // disconnect
  socket.on('disconnect', (reason) => {
    console.log(`[Frontend] Disconnected: ${socket.id} (reason: ${reason})`);
    loggerError(`[Frontend] Disconnected: ${socket.id} (reason: ${reason})`, {
      deviceId: roomManager.getDeviceForSocket(socket.id),
    });

    wsDisconnectionsTotal.inc({ role: 'frontend', reason });

    const deviceId = roomManager.leave(socket.id);
    if (deviceId) {
      deviceManager.removePairedRoom(deviceId, socket.id);
      const device = deviceManager.getDevice(deviceId);
      if (device?.isOnline) {
        const desktopSocket = io.sockets.sockets.get(device.socketId);
        if (desktopSocket) {
          desktopSocket.emit('web-client-disconnected', { socketId: socket.id });
          wsConnectionsActive.dec({ role: 'frontend' });
        }
      }
    }
  });
}

// Helper → relay a command to the desktop agent for a socket's paired device
function relayToDesktop(
  io: SocketServer,
  socket: Socket,
  userEmail: string,
  command: CommandPayload,
  callback?: (res: unknown) => void
): void {
  try {
    const deviceId = roomManager.getDeviceForSocket(socket.id);
    if (!deviceId) return;

    const device = deviceManager.getDevice(deviceId);
    if (!device?.isOnline) return;
    if (device.ownerEmail !== userEmail) return;

    const desktopSocket = io.sockets.sockets.get(device.socketId);
    if (!desktopSocket) return;

    const commandWithSender = { ...command, fromSocketId: socket.id };

    if (callback) {
      desktopSocket.timeout(10000).emit('command', commandWithSender, (_err: Error | null, result: unknown) => {
        callback(result ?? { success: false, message: 'No response' });
      });
    } else {
      desktopSocket.emit('command', commandWithSender);
    }
  } catch (e) {
    serverErrorsTotal.inc({ type: 'command_relay_error' });
    loggerError('Error relaying command to desktop agent', {
      error: e instanceof Error ? e.message : String(e),
      deviceId: roomManager.getDeviceForSocket(socket.id),
    });
  }
}
