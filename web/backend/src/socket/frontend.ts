import { Server as SocketServer, Socket } from 'socket.io';
import { deviceManager } from '../managers/devices';
import { roomManager } from '../managers/rooms';
import { pairTokenManager } from '../managers/pairTokens';
import { CommandPayload } from '../types';
import { wsWebRtcEventsTotal, wsConnectionsActive, serverErrorsTotal, wsDisconnectionsTotal } from '../metrics';

type IceCandidatePayload = {
  candidate?: {
    candidate?: string;
    sdpMid?: string | null;
    sdpMLineIndex?: number | null;
  };
  deviceId: string;
};

export function setupFrontendHandlers(io: SocketServer, socket: Socket): void {

  // join-device — Frontend joins the device's control room.
  // SECURITY: Requires a valid pairToken issued by POST /pair.
  // The token is valid for 30 minutes and can be reused across page refreshes
  // and window reopens. It is revoked when the desktop agent goes offline.
  socket.on('join-device',
    (data: { deviceId: string; pairToken?: string }, callback?: (res: { success: boolean; message?: string }) => void) => {

      const { deviceId, pairToken } = data;

      if (!pairToken) {
        console.warn(`[Frontend] join-device rejected: no pairToken (socket ${socket.id})`);
        callback?.({ success: false, message: 'No pairing token. Please pair the device first.' });
        return;
      }

      // validateToken does NOT consume the token — it stays valid for 30 min
      // so the same browser can rejoin after page refresh or window close/reopen
      const tokenEntry = pairTokenManager.validateToken(pairToken);
      if (!tokenEntry) {
        console.warn(`[Frontend] join-device rejected: token invalid or expired (socket ${socket.id})`);
        callback?.({ success: false, message: 'Session expired (15 min). Please pair again.' });
        return;
      }

      if (tokenEntry.deviceId !== deviceId) {
        callback?.({ success: false, message: 'Token does not match device.' });
        return;
      }

      const device = deviceManager.getDevice(deviceId);
      if (!device) {
        callback?.({ success: false, message: 'Device not found' });
        return;
      }

      if (!device.isOnline) {
        callback?.({ success: false, message: 'Device is offline' });
        return;
      }

      roomManager.join(deviceId, socket.id);
      deviceManager.addPairedRoom(deviceId, socket.id);
      socket.join(deviceId);

      console.log(`[Frontend] ${socket.id} joined device room: ${deviceId}`);

      // Notify the desktop agent that a web client connected
      const desktopSocket = io.sockets.sockets.get(device.socketId);
      if (desktopSocket) {
        desktopSocket.emit('web-client-connected', {
          socketId: socket.id,
          connectedAt: Date.now(),
        });

      }

      callback?.({ success: true });
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

    const desktopSocket = io.sockets.sockets.get(device.socketId);
    if (!desktopSocket) {
      callback?.({ success: false, message: 'Desktop agent not connected' });
      return;
    }

    console.log(`[Frontend] → Desktop [${deviceId}] command: ${command.type}`);
    if (callback) {
      desktopSocket.timeout(10000).emit('command', command, (_err: Error | null, result: unknown) => {
        callback(result ?? { success: false, message: 'No response' });
      });
    } else {
      desktopSocket.emit('command', command);
    }
  });

  // Mouse Move
  socket.on('mouse-move', (data: { x: number; y: number }) => {
    relayToDesktop(io, socket, { type: 'MOUSE_MOVE', payload: data });
  });

  // Mouse Click
  socket.on('mouse-click', (data: { button?: string; doubleClick?: boolean }) => {
    relayToDesktop(io, socket, { type: 'MOUSE_CLICK', payload: data });
  });

  // Mouse Scroll
  socket.on('mouse-scroll', (data: { x: number; y: number }) => {
    relayToDesktop(io, socket, { type: 'MOUSE_SCROLL', payload: data });
  });

  // Keyboard Type
  socket.on('keyboard-type', (data: { text: string }) => {
    relayToDesktop(io, socket, { type: 'KEYBOARD_TYPE', payload: data });
  });

  // Keyboard Shortcut
  socket.on('keyboard-shortcut', (data: { key: string; modifier?: string | string[] }) => {
    relayToDesktop(io, socket, { type: 'KEYBOARD_SHORTCUT', payload: data });
  });

  // Open App
  socket.on('open-app', (data: { app: string }, callback?: (res: unknown) => void) => {
    relayToDesktop(io, socket, { type: 'OPEN_APP', payload: data }, callback);
  });

  // System Commands
  socket.on('system-command', (data: { action: 'SHUTDOWN' | 'RESTART' | 'SLEEP' | 'LOCK_SCREEN' }, callback?: (res: unknown) => void) => {
    relayToDesktop(io, socket, { type: data.action }, callback);
  });

  // Screenshot
  socket.on('request-screenshot', (callback?: (res: unknown) => void) => {
    relayToDesktop(io, socket, { type: 'SCREENSHOT' }, callback);
  });

  // Screen Share Start
  socket.on('screen-share-start', (data: { sessionId: string; frameRate?: number; quality?: number }) => {

    const deviceId = roomManager.getDeviceForSocket(socket.id);
    if (!deviceId) return;

    const device = deviceManager.getDevice(deviceId);
    if (!device?.isOnline) return;

    const desktopSocket = io.sockets.sockets.get(device.socketId);
    if (desktopSocket) {
      desktopSocket.emit('screen-share-request', data);
    }

    console.log(`[Frontend] Screen share requested for device ${deviceId}`);
  });

  // Screen Share Stop
  socket.on('screen-share-stop', (data: { sessionId: string }) => {


    const deviceId = roomManager.getDeviceForSocket(socket.id);
    if (!deviceId) return;

    const device = deviceManager.getDevice(deviceId);
    if (!device?.isOnline) return;

    const desktopSocket = io.sockets.sockets.get(device.socketId);
    if (desktopSocket) {

      desktopSocket?.emit('screen-share-stop', data);
    }


  });

  // WebRTC Signaling relay — frontend → desktop
  socket.on('webrtc-offer', (data: { sdp: unknown; deviceId: string }) => {

    wsWebRtcEventsTotal.inc({ signal_type: 'offer', direction: 'frontend→desktop' });

    console.log(`[Backend] webrtc-offer received from frontend ${socket.id} to device ${data.deviceId}`);
    const device = deviceManager.getDevice(data.deviceId);
    if (!device?.isOnline) return;
    const desktopSocket = io.sockets.sockets.get(device.socketId);
    if (desktopSocket) {
      desktopSocket?.emit('webrtc-offer', { ...data, fromSocketId: socket.id });

    }
  }); 

  socket.on('webrtc-ice-candidate', (data: IceCandidatePayload) => {
    const candidate = data?.candidate;

    // no candidate object
    if (!candidate) {
      console.warn('[Backend] Missing ICE candidate');
      return;
    }

    // invalid candidate
    if (candidate.sdpMid == null && candidate.sdpMLineIndex == null) {
      console.warn('[Backend] Invalid ICE candidate');
      return;
    }

    console.log(`[Backend] webrtc-ice-candidate received from frontend ${socket.id}`);

    const device = deviceManager.getDevice(data.deviceId);

    if (!device?.isOnline) {
      console.warn(`[Backend] Device ${data.deviceId} offline`);
      return;
    }

    const desktopSocket = io.sockets.sockets.get(device.socketId);

    if (!desktopSocket) {
      console.warn('[Backend] Desktop socket missing');
      return;
    }
    desktopSocket.emit('webrtc-ice-candidate', { ...data, fromSocketId: socket.id, });
  });

  socket.on('webrtc-answer', (data: { sdp: unknown; deviceId: string }) => {
    console.log(`[Backend] webrtc-answer received from frontend ${socket.id}`);
    const device = deviceManager.getDevice(data.deviceId);
    if (!device?.isOnline) return;
    const desktopSocket = io.sockets.sockets.get(device.socketId);
    desktopSocket?.emit('webrtc-answer', { ...data, fromSocketId: socket.id });

    wsWebRtcEventsTotal.inc({signal_type: 'answer',direction: 'frontend→desktop',});
  });

  // disconnect
  socket.on('disconnect', (reason) => {
    console.log(`[Frontend] Disconnected: ${socket.id} (reason: ${reason})`);
    // wsDisconnectionsTotal is already incremented in socket/index.ts

    wsDisconnectionsTotal.inc({ role: 'frontend', reason, });

    const deviceId = roomManager.leave(socket.id);
    if (deviceId) {
      deviceManager.removePairedRoom(deviceId, socket.id);
      // Notify the desktop agent that its web client disconnected
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

//  Helper → relay a command to the desktop agent for a socket's paired device  
function relayToDesktop(
  io: SocketServer,
  socket: Socket,
  command: CommandPayload,
  callback?: (res: unknown) => void
): void {

  try {

    const deviceId = roomManager.getDeviceForSocket(socket.id);
    if (!deviceId) return;

    const device = deviceManager.getDevice(deviceId);
    if (!device?.isOnline) return;

    const desktopSocket = io.sockets.sockets.get(device.socketId);
    if (!desktopSocket) return;



    if (callback) {
      desktopSocket.timeout(10000).emit('command', command, (_err: Error | null, result: unknown) => {
        callback(result ?? { success: false, message: 'No response' });
      });
    } else {
      desktopSocket.emit('command', command);
    }
  }

  catch (e) {
    serverErrorsTotal.inc({ type: 'command_relay_error', });

  }
}
