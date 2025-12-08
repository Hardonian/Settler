/**
 * API Gateway Cache Middleware
 * Redis-based request caching for API responses
 * Provides performant query layers with intelligent cache invalidation
 */

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { get, set, del } from '../utils/cache';
import { logInfo, logDebug } from '../utils/logger';

export interface CacheConfig {
  /** Cache TTL in seconds */
  ttl?: number;
  /** Whether to cache this endpoint */
  enabled?: boolean;
  /** Cache key generator function */
  keyGenerator?: (req: Request) => string;
  /** Whether to include query params in cache key */
  includeQueryParams?: boolean;
  /** Whether to include user ID in cache key (for user-specific data) */
  includeUserId?: boolean;
  /** Cache tags for invalidation */
  tags?: string[];
}

const DEFAULT_TTL = 300; // 5 minutes

/**
 * Generate cache key for request
 */
function generateRequestCacheKey(
  req: Request,
  config: CacheConfig
): string {
  if (config.keyGenerator) {
    return config.keyGenerator(req);
  }

  const parts: string[] = ['api', req.method.toLowerCase(), req.path];

  // Include query params if specified
  if (config.includeQueryParams && Object.keys(req.query).length > 0) {
    const sortedQuery = Object.keys(req.query)
      .sort()
      .map((key) => `${key}=${req.query[key]}`)
      .join('&');
    parts.push(sortedQuery);
  }

  // Include user ID if specified
  if (config.includeUserId && (req as AuthRequest).userId) {
    parts.push(`user:${(req as AuthRequest).userId}`);
  }

  return parts.join(':');
}

/**
 * API Gateway Cache Middleware
 * Caches GET request responses in Redis
 */
export function apiGatewayCache(config: CacheConfig = {}) {
  const {
    ttl = DEFAULT_TTL,
    enabled = true,
    tags = [],
  } = config;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only cache GET requests
    if (req.method !== 'GET' || !enabled) {
      return next();
    }

    // Skip caching for authenticated endpoints that require fresh data
    if (req.path.includes('/auth/') || req.path.includes('/webhooks/')) {
      return next();
    }

    try {
      const cacheKey = generateRequestCacheKey(req, config);
      const cached = await get<unknown>(cacheKey);

      if (cached) {
        logDebug('Cache hit', { key: cacheKey, path: req.path });
        res.setHeader('X-Cache', 'HIT');
        res.json(cached);
        return;
      }

      // Cache miss - intercept response
      res.setHeader('X-Cache', 'MISS');
      const originalJson = res.json.bind(res);
      res.json = function (body: unknown) {
        // Cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          set(cacheKey, body, ttl).catch((error) => {
            logDebug('Cache set failed', { error, key: cacheKey });
          });

          // Store cache tags for invalidation
          if (tags.length > 0) {
            tags.forEach((tag) => {
              const tagKey = `cache:tag:${tag}`;
              get<string[]>(tagKey).then((taggedKeys) => {
                const keys = taggedKeys || [];
                if (!keys.includes(cacheKey)) {
                  keys.push(cacheKey);
                  set(tagKey, keys, ttl * 2).catch(() => {});
                }
              });
            });
          }
        }

        return originalJson(body);
      } as typeof originalJson;

      next();
    } catch (error) {
      logDebug('Cache middleware error', { error });
      // Continue without caching on error
      next();
    }
  };
}

/**
 * Cache invalidation middleware
 * Invalidates cache on state-changing operations
 */
export function cacheInvalidation(tags: string[] = []) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only invalidate on state-changing methods
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return next();
    }

    const originalEnd = res.end.bind(res);

    res.end = function (chunk?: unknown, encoding?: BufferEncoding, cb?: () => void) {
      // Invalidate cache on successful state changes
      if (res.statusCode >= 200 && res.statusCode < 300) {
        invalidateCache(req, tags).catch((error) => {
          logDebug('Cache invalidation error', { error });
        });
      }

      if (encoding !== undefined && typeof encoding === 'string') {
        originalEnd(chunk, encoding, cb);
      } else if (cb !== undefined) {
        originalEnd(chunk, cb);
      } else {
        originalEnd(chunk);
      }
    } as typeof originalEnd;

    next();
  };
}

/**
 * Invalidate cache by tags or patterns
 */
async function invalidateCache(req: Request, tags: string[]): Promise<void> {
  try {
    // Invalidate by tags
    for (const tag of tags) {
      const tagKey = `cache:tag:${tag}`;
      const taggedKeys = await get<string[]>(tagKey);
      if (taggedKeys) {
        for (const key of taggedKeys) {
          await del(key);
        }
        await del(tagKey);
      }
    }

    // Invalidate by pattern
    const patterns = generateInvalidationPatterns(req);
    for (const _pattern of patterns) {
      // Pattern-based invalidation would require Redis SCAN
      // For now, skip pattern-based invalidation
      // await delPattern(pattern);
    }

    logInfo('Cache invalidated', { tags, patterns, path: req.path });
  } catch (error) {
    logDebug('Cache invalidation failed', { error });
  }
}

/**
 * Generate cache invalidation patterns from request
 */
function generateInvalidationPatterns(req: Request): string[] {
  const patterns: string[] = [];

  // Invalidate by path
  patterns.push(`api:*:${req.path}*`);

  // Invalidate by resource ID
  const resourceId = req.params.id;
  if (resourceId) {
    patterns.push(`api:*:*${resourceId}*`);
  }

  // Invalidate user-specific cache
  if ((req as AuthRequest).userId) {
    patterns.push(`api:*:*user:${(req as AuthRequest).userId}*`);
  }

  return patterns;
}

/**
 * Predefined cache configurations for common endpoints
 */
export const cacheConfigs = {
  // Jobs endpoints
  jobsList: (): CacheConfig => ({
    ttl: 60, // 1 minute
    includeQueryParams: true,
    includeUserId: true,
    tags: ['jobs'],
  }),

  jobGet: (): CacheConfig => ({
    ttl: 300, // 5 minutes
    includeUserId: true,
    tags: ['jobs'],
  }),

  // Reports endpoints
  reportGet: (): CacheConfig => ({
    ttl: 60, // 1 minute (reports change frequently)
    includeUserId: true,
    tags: ['reports'],
  }),

  // Adapters endpoints (rarely change)
  adaptersList: (): CacheConfig => ({
    ttl: 3600, // 1 hour
    tags: ['adapters'],
  }),

  adapterGet: (): CacheConfig => ({
    ttl: 3600, // 1 hour
    tags: ['adapters'],
  }),

  // Reconciliation summary (cached aggressively)
  reconciliationSummary: (): CacheConfig => ({
    ttl: 30, // 30 seconds
    includeQueryParams: true,
    includeUserId: true,
    tags: ['reconciliation', 'summary'],
  }),
};
