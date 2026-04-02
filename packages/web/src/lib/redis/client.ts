/**
 * Redis Client (Upstash)
 *
 * Provides Redis client for rate limiting, caching, and queues.
 * Gracefully falls back to in-memory store if Redis unavailable.
 */

type RedisClient = import("@upstash/redis").Redis;

let redisInstance: RedisClient | null = null;
let initializationPromise: Promise<RedisClient | null> | null = null;

async function initRedis(): Promise<RedisClient | null> {
  const restUrl = process.env.UPSTASH_REDIS_REST_URL;
  const restToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  const shouldLog = process.env.NODE_ENV !== "test" && process.env.SETTLER_REDIS_SILENCE !== "1";

  if (!restUrl || !restToken) {
    if (shouldLog) {
      console.warn("[Redis] Upstash Redis not configured — using in-memory fallback");
    }
    return null;
  }

  try {
    const { Redis } = await import("@upstash/redis");
    const client = new Redis({ url: restUrl, token: restToken });
    if (shouldLog) {
      console.warn("[Redis] Connected to Upstash Redis");
    }
    return client;
  } catch (error) {
    if (shouldLog) {
      console.warn("[Redis] Failed to initialise Redis client — using in-memory fallback:", error);
    }
    return null;
  }
}

/**
 * Get Redis client (lazy, singleton, async).
 * Resolves to null if Redis is not configured or unavailable.
 */
export async function getRedisClient(): Promise<RedisClient | null> {
  if (redisInstance !== null) return redisInstance;
  if (initializationPromise) return initializationPromise;

  initializationPromise = initRedis().then((client) => {
    redisInstance = client;
    return client;
  });

  return initializationPromise;
}

/**
 * Safe Redis operation wrapper.
 * Falls back gracefully if Redis unavailable.
 */
export async function safeRedisOperation<T>(
  operation: (client: RedisClient) => Promise<T>,
  fallback: () => T | Promise<T>
): Promise<T> {
  const client = await getRedisClient();
  if (!client) return fallback();

  try {
    return await operation(client);
  } catch (error) {
    if (process.env.NODE_ENV !== "test" && process.env.SETTLER_REDIS_SILENCE !== "1") {
      console.warn("[Redis] Operation failed — using fallback:", error);
    }
    return fallback();
  }
}
