import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { getRedis } from '../lib/redis';

export interface RateLimiterOptions {
  keyPrefix: string;
  max: number;
  windowSec: number;
  identifierFn?: (req: Request) => string;

  // If Redis fails:
  // true  -> allow request
  // false -> block request
  failOpen?: boolean;
}

interface AuthRequest extends Request {
  user?: {
    userId?: string;
  };
}

 
 /* Fixed-window Redis rate limiter
 * Algorithm (atomic via Lua):
 * 1. INCR key
 * 2. If first request → set EXPIRE
 * 3. Reject if count > max
 */

const luaScript = `
  local current = redis.call('INCR', KEYS[1])
  if current == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
  end
  return {current, redis.call('TTL', KEYS[1])}
`;

// Prevent Redis memory abuse from fake identifiers
function hashIdentifier(identifier: string): string {
  return crypto
    .createHash('sha256')
    .update(identifier)
    .digest('hex');
}

export function createRateLimiter(options: RateLimiterOptions) {
  const {
    keyPrefix,
    max,
    windowSec,
    identifierFn,
    failOpen = true,
  } = options;

  return async function rateLimiterMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const rawIdentifier =
      identifierFn?.(req) ??
      req.ip ??
      'unknown';

    const hashedIdentifier = hashIdentifier(rawIdentifier);
    const key = `${keyPrefix}:${hashedIdentifier}`;

    try {
      const redis = getRedis();
      
      // If no redis connection is available (e.g. no REDIS_URL), skip rate limiting
      if (!redis ) {
        return next();
      }

      // Better in production: preload script + use evalsha
      const result = (await (redis as any).eval(
        luaScript,
        1,
        key,
        String(windowSec),
      )) as [number, number];

      const count = result[0];
      const ttl = result[1] > 0 ? result[1] : windowSec;
      const remaining = Math.max(0, max - count);

      // RFC standard headers
      res.setHeader('RateLimit-Limit', max);
      res.setHeader('RateLimit-Remaining', remaining);
      res.setHeader('RateLimit-Reset', ttl);

      // backward compatibility
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', ttl);

      if (count > max) {
        res.setHeader('Retry-After', ttl.toString());

        res.status(429).json({
          message: 'Too many requests. Please try again later.',
          retryAfter: ttl,
        });

        return;
      }

      next();
    } catch (err) {
      console.error(
        '[RateLimiter] Redis error:',
        (err as Error).message,
      );

      // fail closed for sensitive routes
      if (!failOpen) {
        res.status(503).json({
          message: 'Service temporarily unavailable',
        });
        return;
      }

      next();
    }
  };
}

// Global fallback: 100 req / min
export const globalRateLimiter = createRateLimiter({
  keyPrefix: 'rl:global',
  max: 100,
  windowSec: 60,
  failOpen: true,
});

// Login: fail CLOSED 10 req / 5 min per IP
export const loginRateLimiter = createRateLimiter({
  keyPrefix: 'rl:login',
  max: 10,
  windowSec: 5 * 60,
  failOpen: false,
});

// Register: fail CLOSED 5 req / 1 hr per IP 
export const registerRateLimiter = createRateLimiter({
  keyPrefix: 'rl:register',
  max: 5,
  windowSec: 60 * 60,
  failOpen: false,
});

// Pair device 10 req / 1 min per IP 
export const pairRateLimiter = createRateLimiter({
  keyPrefix: 'rl:pair',
  max: 10,
  windowSec: 60,
  failOpen: true,
});

// Device reads 20 req / 1 min per authenticated user 
export const deviceReadRateLimiter = createRateLimiter({
  keyPrefix: 'rl:devices:read',
  max: 20,
  windowSec: 60,
  failOpen: true,
  identifierFn: (req) =>
    (req as AuthRequest).user?.userId ??
    req.ip ??
    'anon',
});

// Device commands 30 req / 1 min per authenticated user 
export const deviceCommandRateLimiter = createRateLimiter({
  keyPrefix: 'rl:devices:cmd',
  max: 30,
  windowSec: 60,
  failOpen: true,
  identifierFn: (req) =>
    (req as AuthRequest).user?.userId ??
    req.ip ??
    'anon',
});