import type { VercelRequest, VercelResponse } from '@vercel/node';
import { cacheGet, cacheSet } from './redis';

interface RateLimitConfig {
  windowSeconds: number; // e.g. 60 seconds
  maxRequests: number;  // e.g. 100 requests per window
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowSeconds: 60,
  maxRequests: 100,
};

// In-memory fallback bucket for local dev or when Redis is absent
const inMemoryBucket = new Map<string, { count: number; expiresAt: number }>();

/**
 * Serverless Rate Limiting Middleware (Sliding Window Algorithm)
 * Protects PostgreSQL database from connection exhaustion and brute-force abuse.
 *
 * Returns true if allowed, false if rate limited (429).
 */
export async function checkRateLimit(
  req: VercelRequest,
  res: VercelResponse,
  identifier?: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<boolean> {
  const ip =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    req.socket.remoteAddress ||
    '127.0.0.1';

  const key = `ratelimit:${identifier || ip}`;
  const now = Math.floor(Date.now() / 1000);

  // Try Redis rate limit first
  const currentCount = await cacheGet<number>(key);

  if (currentCount !== null) {
    if (currentCount >= config.maxRequests) {
      res.setHeader('Retry-After', String(config.windowSeconds));
      res.setHeader('X-RateLimit-Limit', String(config.maxRequests));
      res.setHeader('X-RateLimit-Remaining', '0');
      res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${config.windowSeconds} seconds.`,
      });
      return false;
    }

    await cacheSet(key, currentCount + 1, config.windowSeconds);
    res.setHeader('X-RateLimit-Limit', String(config.maxRequests));
    res.setHeader(
      'X-RateLimit-Remaining',
      String(config.maxRequests - currentCount - 1)
    );
    return true;
  }

  // In-memory fallback rate limiting
  const memEntry = inMemoryBucket.get(key);
  if (memEntry && memEntry.expiresAt > now) {
    if (memEntry.count >= config.maxRequests) {
      res.setHeader('Retry-After', String(config.windowSeconds));
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded.',
      });
      return false;
    }
    memEntry.count += 1;
  } else {
    inMemoryBucket.set(key, {
      count: 1,
      expiresAt: now + config.windowSeconds,
    });
  }

  return true;
}
