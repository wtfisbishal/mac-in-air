 
import { Router, Request, Response } from 'express';
import { pairingManager } from '../managers/pairing';
import { deviceManager } from '../managers/devices';
import { roomManager } from '../managers/rooms';
import { pairTokenManager } from '../managers/pairTokens';
import { getIo } from '../socket';

const router = Router();
 
router.post('/', (req: Request, res: Response): void => {
  const { code, frontendSocketId } = req.body;

  if (!code) {
    res.status(400).json({ message: 'code is required' });
    return;
  }

  const entry = pairingManager.lookupCode(String(code));

  if (!entry) {
    res.status(404).json({ message: 'Invalid or expired pairing code' });
    return;
  }

  const device = deviceManager.getDevice(entry.deviceId);

  if (!device || !device.isOnline) {
    res.status(503).json({ message: 'Device is offline. Please retry.' });
    return;
  }

  // Add the frontend socket to this device's room (if socket id provided)
  if (frontendSocketId) {
    roomManager.join(entry.deviceId, frontendSocketId);
    deviceManager.addPairedRoom(entry.deviceId, frontendSocketId);
  }

  // Issue a 15-min pairToken the frontend stores in localStorage.
  // This token can be reused on page refresh / window reopen.
  const pairToken = pairTokenManager.issueToken(entry.deviceId);

  // Notify the desktop agent
  const io = getIo();
  const desktopSocket = io.sockets.sockets.get(entry.socketId);
  if (desktopSocket) {
    desktopSocket.emit('pairing-complete', {
      deviceId: entry.deviceId,
      frontendSocketId,
    });
  }

  // Notify all frontends about device status change
  io.emit('device-status-changed', {
    deviceId: device.id,
    isOnline: true,
  });

  res.json({
    success: true,
    pairToken, //  frontend must send this when emitting join-device
    device: {
      id: device.id,
      name: device.name,
      platform: device.platform,
      arch: device.arch,
      isOnline: device.isOnline,
      user: device.user,
    },
  });
});

export default router;
