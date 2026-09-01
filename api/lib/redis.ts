import { Redis } from '@upstash/redis';

/**
 * Serverless Redis Cache Client (Phase 4 — Performance Foundation)
 *
 * Implements high-performance caching for derived read models, dashboard summaries,
 * rates, and rate limiting.
 *
 * FALLBACK GUARANTEE:
 *   If Upstash Redis environment variables are missing or if Redis experiences
 *   any network/timeout error, every method gracefully catches the error and returns
 *   null / false. The system automatically falls back to PostgreSQL without failing.
 */

let redisInstance: Redis | null = null;

function getRedisClient(): Redis | null {
  if (redisInstance) return redisInstance;

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.VITE_UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.VITE_UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null; // Redis not configured — transparent DB fallback
  }

  try {
    redisInstance = new Redis({ url, token });
    return redisInstance;
  } catch (err) {
    console.warn('[Redis] Initialization error, falling back to database:', err);
    return null;
  }
}

/**
 * Gets a cached JSON value by key. Returns null on cache miss or error.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) return null;

  try {
    const data = await client.get<T>(key);
    return data ?? null;
  } catch (err) {
    console.warn(`[Redis] GET error for key ${key}:`, err);
    return null;
  }
}

/**
 * Sets a cached value with TTL in seconds.
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds = 300
): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    await client.set(key, value, { ex: ttlSeconds });
    return true;
  } catch (err) {
    console.warn(`[Redis] SET error for key ${key}:`, err);
    return false;
  }
}

/**
 * Deletes a key from cache (invalidation).
 */
export async function cacheDel(key: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    await client.del(key);
    return true;
  } catch (err) {
    console.warn(`[Redis] DEL error for key ${key}:`, err);
    return false;
  }
}

/**
 * Invalidation pattern: Deletes all keys matching a prefix for a user.
 */
export async function cacheInvalidateUser(userId: string): Promise<void> {
  await Promise.all([
    cacheDel(`dashboard:${userId}:6`),
    cacheDel(`dashboard:${userId}:12`),
    cacheDel(`accounts:${userId}`),
  ]);
}
