/**
 * Cache Invalidation Strategies
 * Provides utilities for invalidating cache entries based on patterns
 */

import { del, delPattern, cacheKey } from './cache';
import { logInfo } from './logger';

/**
 * Invalidate cache for a specific job
 */
export async function invalidateJobCache(jobId: string): Promise<void> {
  const patterns = [
    cacheKey('job', jobId),
    cacheKey('job', jobId, '*'),
    cacheKey('reports', jobId),
    cacheKey('reports', jobId, '*'),
  ];

  for (const pattern of patterns) {
    await del(pattern);
  }

  logInfo('Job cache invalidated', { jobId });
}

/**
 * Invalidate cache for a specific user
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  const patterns = [
    cacheKey('user', userId),
    cacheKey('user', userId, '*'),
    cacheKey('jobs', userId, '*'),
  ];

  for (const pattern of patterns) {
    await delPattern(pattern);
  }

  logInfo('User cache invalidated', { userId });
}

/**
 * Invalidate cache for a specific tenant
 */
export async function invalidateTenantCache(tenantId: string): Promise<void> {
  const patterns = [
    cacheKey('tenant', tenantId),
    cacheKey('tenant', tenantId, '*'),
  ];

  for (const pattern of patterns) {
    await delPattern(pattern);
  }

  logInfo('Tenant cache invalidated', { tenantId });
}

/**
 * Invalidate all adapter-related cache
 */
export async function invalidateAdapterCache(adapterName: string): Promise<void> {
  const patterns = [
    cacheKey('adapter', adapterName),
    cacheKey('adapter', adapterName, '*'),
  ];

  for (const pattern of patterns) {
    await delPattern(pattern);
  }

  logInfo('Adapter cache invalidated', { adapterName });
}

/**
 * Invalidate cache after job status change
 */
export async function invalidateJobStatusCache(jobId: string, oldStatus: string, newStatus: string): Promise<void> {
  // Invalidate job cache
  await invalidateJobCache(jobId);

  // Invalidate status-specific caches
  if (oldStatus !== newStatus) {
    await del(cacheKey('jobs', 'status', oldStatus));
    await del(cacheKey('jobs', 'status', newStatus));
  }
}

/**
 * Invalidate cache after report generation
 */
export async function invalidateReportCache(jobId: string): Promise<void> {
  await del(cacheKey('reports', jobId));
  await del(cacheKey('reports', jobId, 'summary'));
  await del(cacheKey('reports', jobId, 'details'));
}
