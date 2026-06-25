import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { deviceManager } from '../managers/devices';
import { getIo } from '../socket';
import { CommandPayload } from '../types';

const router = Router();

// GET /devices — list all known devices
router.get('/', requireAuth, (_req: Request, res: Response): void => {
  res.json(deviceManager.listForApi());
});

// GET /devices/:id — get a single device
router.get('/:id', requireAuth, (req: Request, res: Response): void => {
  const device = deviceManager.getDevice(req.params.id);

  if (!device) {
    res.status(404).json({ message: 'Device not found' });
    return;
  }

  const { id, name, platform, arch, isOnline,user , display , connectedAt } = device;
  res.json({ id, name, platform, arch, isOnline,user,display, connectedAt });
});

// POST /devices/:id/commands — relay a command to the device
router.post('/:id/commands', requireAuth, (req: Request, res: Response): void => {
  const { id } = req.params;
  const command: CommandPayload = req.body;

  if (!command.type) {
    res.status(400).json({ message: 'command.type is required' });
    return;
  }

  const device = deviceManager.getDevice(id);

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
