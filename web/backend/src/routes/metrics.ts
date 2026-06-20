import { Router, Request, Response } from 'express';
import { register } from '../metrics';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const metrics = await register.metrics();
    res.set('Content-Type', register.contentType);
    res.end(metrics);
  } catch (err) {
    res.status(500).end(String(err));
  }
});

export default router;
