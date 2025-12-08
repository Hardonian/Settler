/**
 * Performance Profiling Utilities
 * Provides request duration tracking, database query profiling, and memory monitoring
 */

import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';
import { logWarn } from '../../utils/logger';
import { AuthRequest } from '../../middleware/auth';

export interface ProfileMetrics {
  requestDuration: number;
  databaseQueries?: number;
  databaseDuration?: number;
  memoryUsage?: NodeJS.MemoryUsage;
  timestamp: string;
}

const SLOW_REQUEST_THRESHOLD = 1000; // 1 second
const SLOW_DB_THRESHOLD = 500; // 500ms

/**
 * Middleware to profile request performance
 */
export function profilingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = performance.now();
  const startMemory = process.memoryUsage();

  // Track database queries
  let queryCount = 0;
  let dbDuration = 0;

  // Override res.end to capture metrics
  const originalEnd = res.end.bind(res);
  (res as { end: typeof originalEnd }).end = function(chunk?: unknown, encoding?: unknown, cb?: () => void) {
    const duration = performance.now() - startTime;
    const endMemory = process.memoryUsage();
    const memoryDelta: NodeJS.MemoryUsage = {
      rss: endMemory.rss - startMemory.rss,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      external: endMemory.external - startMemory.external,
      arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers,
    };

    // Log slow requests
    if (duration > SLOW_REQUEST_THRESHOLD) {
      logWarn('Slow request detected', {
        path: req.path,
        method: req.method,
        duration,
        queryCount,
        dbDuration,
        memoryDelta: memoryDelta.heapUsed,
        traceId: (req as AuthRequest).traceId,
      });
    }

    // Add metrics to response header (for debugging)
    res.setHeader('X-Request-Duration', `${duration.toFixed(2)}ms`);
    if (queryCount > 0) {
      res.setHeader('X-DB-Queries', queryCount.toString());
      res.setHeader('X-DB-Duration', `${dbDuration.toFixed(2)}ms`);
    }

    // Call original end with proper typing
    if (typeof encoding === 'function') {
      // encoding is actually a callback function
      originalEnd(chunk as unknown, encoding as unknown as () => void);
    } else if (typeof chunk === 'function') {
      // chunk is actually a callback function
      originalEnd(chunk as unknown as () => void);
    } else if (encoding !== undefined && typeof encoding === 'string') {
      // encoding is a BufferEncoding string
      originalEnd(chunk as unknown, encoding as BufferEncoding, cb);
    } else if (cb !== undefined) {
      // cb is provided but encoding is not - call with chunk and cb only
      originalEnd(chunk as unknown, cb);
    } else {
      // Only chunk provided
      originalEnd(chunk as unknown);
    }
  } as typeof originalEnd;

  next();
}

/**
 * Profile database query execution
 */
export function profileQuery<T>(
  queryFn: () => Promise<T>,
  queryName?: string
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  return queryFn().then((result) => {
    const duration = performance.now() - start;

    if (duration > SLOW_DB_THRESHOLD) {
      logWarn('Slow database query detected', {
        query: queryName || 'unknown',
        duration,
      });
    }

    return { result, duration };
  });
}

/**
 * Get current memory usage
 */
export function getMemoryUsage(): NodeJS.MemoryUsage {
  return process.memoryUsage();
}

/**
 * Format memory usage for logging
 */
export function formatMemoryUsage(usage: NodeJS.MemoryUsage): string {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return `Heap: ${formatBytes(usage.heapUsed)}/${formatBytes(usage.heapTotal)}, External: ${formatBytes(usage.external)}`;
}

/**
 * Memory usage monitoring endpoint data
 */
export function getMemoryMetrics(): {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  formatted: string;
} {
  const usage = process.memoryUsage();
  return {
    heapUsed: usage.heapUsed,
    heapTotal: usage.heapTotal,
    external: usage.external,
    rss: usage.rss,
    formatted: formatMemoryUsage(usage),
  };
}
