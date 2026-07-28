import { Router, Request, Response } from 'express';
import { deviceManager } from '../managers/devices';
import { roomManager } from '../managers/rooms';
import { pairTokenManager } from '../managers/pairTokens';
import { getIo } from '../socket';
import { pairRateLimiter } from '../middleware/rateLimiter';
import { requireAuth } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();

// pairingChallenge = HMAC-SHA256(PBKDF2(masterPassword, salt), deviceId)
//The backend does a timing-safe comparison against the stored challenge.
//The raw master password never leaves the user's browser.

router.post('/', requireAuth, pairRateLimiter, (req: Request, res: Response): void => {
  const { deviceId, frontendSocketId, pairingChallenge } = req.body;
  const userEmail = (req as any).user?.email as string;

  if (!deviceId) {
    res.status(400).json({ message: 'deviceId is required' });
    return;
  }

  const device = deviceManager.getDevice(String(deviceId));

  if (!device) {
    res.status(404).json({ message: 'Device not found' });
    return;
  }

  if (!device.isOnline) {
    res.status(503).json({ message: 'Device is offline. Please retry.' });
    return;
  }

  // only the device owner can pair with it
  if (device.ownerEmail.toLowerCase() !== userEmail.toLowerCase()) {
    res.status(403).json({ message: 'Access denied: this device belongs to a different account.' });
    return;
  }

  // Zero-trust master key verification
  // If the device has a pairingChallenge registered (master key was set up),
  // the frontend MUST provide a matching challenge derived from the master password.

  if (device.pairingChallenge) {
    if (!pairingChallenge || typeof pairingChallenge !== 'string') {
      res.status(401).json({ message: 'Master key verification required. Enter your master password to pair.' });
      return;
    }

    // Timing-safe comparison to prevent timing attacks
    let challengesMatch = false;
    try {
      const storedBuf   = Buffer.from(device.pairingChallenge, 'hex');
      const providedBuf = Buffer.from(pairingChallenge, 'hex');
      
      if (storedBuf.length === providedBuf.length) {
        challengesMatch = crypto.timingSafeEqual(storedBuf, providedBuf);
      }
    } catch (err) {
      console.error('[Pair] Error verifying challenge:', err);
      challengesMatch = false;
    }

    if (!challengesMatch) {
      console.warn(`[Pair] Master key mismatch for device ${deviceId} (user: ${userEmail})`);
      res.status(403).json({ message: 'Invalid master password. Pairing denied.' });
      return;
    }

    console.log(`[Pair] Master key verified for device ${deviceId} (user: ${userEmail})`);
  }

  // Add the frontend socket to this device's room
  if (frontendSocketId) {
    roomManager.join(device.id, frontendSocketId);
    deviceManager.addPairedRoom(device.id, frontendSocketId);
  }

  // Issue a pairToken the frontend stores in sessionStorage
  const pairToken = pairTokenManager.issueToken(device.id);

  // Notify the desktop agent that a pairing completed
  const io = getIo();
  const desktopSocket = io.sockets.sockets.get(device.socketId);
  if (desktopSocket) {
    desktopSocket.emit('pairing-complete', {
      deviceId: device.id,
      frontendSocketId,
    });
  }

  // Notify all frontends of this owner
  io.to(`user:${userEmail}`).emit('device-status-changed', {
    ...device,
    pairedRooms: undefined, // strip non-serializable Set
  });

  console.log(`[Pair] Device ${device.id} paired by ${userEmail}`);

  res.json({
    success: true,
    pairToken,
    device: {
      id: device.id,
      name: device.name,
      platform: device.platform,
      arch: device.arch,
      isOnline: device.isOnline,
      user: device.user,
      ownerEmail: device.ownerEmail,
      masterSalt: device.masterSalt,
    },
  });
});

export default router;
