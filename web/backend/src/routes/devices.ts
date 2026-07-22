import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { deviceManager } from '../managers/devices';
import { getIo } from '../socket';
import { CommandPayload } from '../types';
import { deviceReadRateLimiter, deviceCommandRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// GET /devices — list devices owned by the authenticated user's email
router.get('/', requireAuth, deviceReadRateLimiter, (req: Request, res: Response): void => {
  const email = (req as any).user.email;
  res.json(deviceManager.listForEmail(email));
});

// GET /devices/:id — get a single device (must belong to authenticated user)
router.get('/:id', requireAuth, deviceReadRateLimiter, (req: Request, res: Response): void => {
  const email = (req as any).user.email;
  const device = deviceManager.getDeviceForEmail(req.params.id, email);

  if (!device) {
    res.status(404).json({ message: 'Device not found' });
    return;
  }

  const { id, name, platform, arch, isOnline, user, ownerEmail, display, connectedAt, masterSalt } = device;
  res.json({ id, name, platform, arch, isOnline, user, ownerEmail, display, connectedAt, masterSalt });
});

// POST /devices/:id/commands — relay a command to the device (must belong to authenticated user)
router.post('/:id/commands', requireAuth, deviceCommandRateLimiter, (req: Request, res: Response): void => {
  const email = (req as any).user.email;
  const { id } = req.params;
  const command: CommandPayload = req.body;

  if (!command.type) {
    res.status(400).json({ message: 'command.type is required' });
    return;
  }

  const device = deviceManager.getDeviceForEmail(id, email);

  if (!device) {
    res.status(404).json({ message: 'Device not found' });
    return;
  }

  if (!device.isOnline) {
    res.status(503).json({ message: 'Device is offline' });
    return;
  }

  const io = getIo();
  const desktopSocket = io.sockets.sockets.get(device.socketId);

  if (!desktopSocket) {
    res.status(503).json({ message: 'Desktop agent socket not connected' });
    return;
  }

  // Forward command to desktop agent and wait for result
  desktopSocket.timeout(10000).emit(
    'command',
    command,
    (err: Error | null, result: unknown) => {
      if (err) {
        res.status(504).json({ message: 'Command timed out', success: false });
        return;
      }
      res.json(result);
    }
  );
});

export default router;
