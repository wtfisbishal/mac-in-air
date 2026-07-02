import { Router, Request, Response } from 'express';
import { userManager } from '../managers/users';
import { signToken } from '../middleware/auth';
import { loginRateLimiter, registerRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// POST /auth/register
router.post('/register', registerRateLimiter, async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' });
    return;
  }

  if (typeof password !== 'string' || password.length < 6) {
    res.status(400).json({ message: 'Password must be at least 6 characters' });
    return;
  }

  try {
    const user = await userManager.register(email, password);
    const token = signToken({ userId: user.id, email: user.email });

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (err: any) {
    res.status(409).json({ message: err.message || 'Registration failed' });
  }
});

// POST /auth/login
router.post('/login', loginRateLimiter, async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required' });
    return;
  }

  try {
    const user = await userManager.validatePassword(email, password);

    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const token = signToken({ userId: user.id, email: user.email });

    res.json({
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Login failed' });
  }
});

export default router;
