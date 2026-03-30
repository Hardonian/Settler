import {
  cache as redisCache,
  getRedisClient as getRedisClientFromInfra,
} from "../infrastructure/redis/client";

type MemoryEntry = {
  value: unknown;
  expiresAt: number | null;
};

const memoryCache = new Map<string, MemoryEntry>();

function isExpired(entry: MemoryEntry): boolean {
  return typeof entry.expiresAt === "number" && entry.expiresAt <= Date.now();
}

function memorySet(key: string, value: unknown, ttlSeconds?: number): void {
  memoryCache.set(key, {
    value,
    expiresAt: typeof ttlSeconds === "number" ? Date.now() + ttlSeconds * 1000 : null,
  });
}

function memoryGet<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) {
    return null;
  }
  if (isExpired(entry)) {
    memoryCache.delete(key);
    return null;
  }
  return entry.value as T;
}

export function cacheKey(...parts: Array<string | number | null | undefined>): string {
  return parts
    .filter((part): part is string | number => part !== null && part !== undefined)
    .map((part) => String(part).trim())
    .filter((part) => part.length > 0)
    .join(":");
}

export function getRedisClient() {
  return getRedisClientFromInfra();
}

export async function get<T = unknown>(key: string): Promise<T | null> {
  try {
    const cached = await redisCache.get<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }
  } catch {
    // degraded to in-memory cache below
  }
  return memoryGet<T>(key);
}

export async function set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
  try {
    await redisCache.set(key, value, ttlSeconds);
  } finally {
    memorySet(key, value, ttlSeconds);
  }
}

export async function del(key: string): Promise<void> {
  try {
    await redisCache.del(key);
  } finally {
    memoryCache.delete(key);
  }
}

export async function delPattern(pattern: string): Promise<number> {
  let deleted = 0;
  const prefix = pattern.endsWith("*") ? pattern.slice(0, -1) : pattern;
  for (const key of Array.from(memoryCache.keys())) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
      deleted++;
    }
  }
  return deleted;
}

export async function withCache<T>(
  key: string,
  ttlMs: number,
  producer: () => Promise<T>
): Promise<T> {
  const cached = await get<T>(key);
  if (cached !== null && cached !== undefined) {
    return cached;
  }
  const value = await producer();
  await set(key, value, Math.max(1, Math.floor(ttlMs / 1000)));
  return value;
}

export async function close(): Promise<void> {
  memoryCache.clear();
}
