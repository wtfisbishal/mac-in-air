import Redis from 'ioredis';

let redisClient: Redis | null = null;


//Returns the singleton Redis client.
 
export function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) {
    return null;
  }

  if (!redisClient) {
    const url = process.env.REDIS_URL;
    const password = process.env.REDIS_PASSWORD;

    redisClient = new Redis(url, {
      password: password,
      // Retry strategy: back off up to 10 s, give up after 10 failed attempts.
      retryStrategy(times) {
        if (times > 10) return null; // stop retrying
        return Math.min(times * 300, 10_000);
      },
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      lazyConnect: true,
    });

    redisClient.on('connect', () => {
      console.log('[Redis] Connected');
    });

    redisClient.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message);
    });

    redisClient.on('close', () => {
      console.warn('[Redis] Connection closed');
    });
  }

  return redisClient;
}


// Gracefully disconnect on process exit.

process.on('SIGTERM', () => redisClient?.quit());
process.on('SIGINT', () => redisClient?.quit());
