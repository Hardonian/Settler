/**
 * Redis Client (Upstash)
 * 
 * Provides Redis client for rate limiting, caching, and queues.
 * Gracefully falls back to in-memory store if Redis unavailable.
 */

// Optional Redis import - gracefully handles if package not installed
 
type Redis = any;

let redisClient: Redis | null = null;
let redisAvailable = false;

/**
 * Initialize Redis client
 * Falls back gracefully if Redis not configured
 */
function initRedis(): Redis | null {
  if (redisClient) {
    return redisClient;
  }

  const restUrl = process.env.UPSTASH_REDIS_REST_URL;
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!restUrl || !restToken) {
    console.warn('[Redis] Upstash Redis not configured, using in-memory fallback');
    redisAvailable = false;
    return null;
  }

  // Use dynamic import with promise handling
  return import('@upstash/redis')
    .then(({ Redis: RedisClient }) => {
      redisClient = new RedisClient({
        url: restUrl,
        token: restToken,
      });
      redisAvailable = true;
      return redisClient;
    })
    .catch((error) => {
      console.warn('[Redis] Failed to initialize Redis client (package may not be installed), using in-memory fallback:', error);
      redisAvailable = false;
      return null;
    });
}

/**
 * Get Redis client (lazy initialization)
 */
export function getRedisClient(): Redis | null {
  return initRedis();
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  if (redisClient === null) {
    initRedis();
  }
  return redisAvailable;
}

/**
 * Safe Redis operation wrapper
 * Falls back gracefully if Redis unavailable
 */
export async function safeRedisOperation<T>(
  operation: (client: Redis) => Promise<T>,
  fallback: () => T | Promise<T>
): Promise<T> {
  const client = getRedisClient();
  if (!client) {
    return fallback();
  }

  try {
    return await operation(client);
  } catch (error) {
    console.warn('[Redis] Operation failed, using fallback:', error);
    return fallback();
  }
}
