/**
 * Governance State Cache
 * Simple in-memory cache for governance state to reduce database queries
 */

import { checkTenantFrozen } from "../middleware/governance";

interface CacheEntry {
  frozen: boolean;
  frozen_at?: string;
  frozen_by?: string;
  freeze_reason?: string;
  cachedAt: number;
}

// Simple in-memory cache with TTL
const cache = new Map<string, CacheEntry>();

// TTL in milliseconds (30 seconds)
const CACHE_TTL = 30000;

/**
 * Get tenant freeze state with caching
 * Uses short-lived (30s) in-memory cache to reduce database load
 */
export async function getCachedTenantFreezeState(tenantId: string): Promise<{
  frozen: boolean;
  frozen_at?: string;
  frozen_by?: string;
  freeze_reason?: string;
}> {
  const now = Date.now();
  const cached = cache.get(tenantId);

  // Return cached value if fresh
  if (cached && now - cached.cachedAt < CACHE_TTL) {
    return {
      frozen: cached.frozen,
      frozen_at: cached.frozen_at,
      frozen_by: cached.frozen_by,
      freeze_reason: cached.freeze_reason,
    };
  }

  // Fetch fresh value
  const state = await checkTenantFrozen(tenantId);

  // Update cache
  cache.set(tenantId, {
    frozen: state.frozen,
    frozen_at: state.frozen_at,
    frozen_by: state.frozen_by,
    freeze_reason: state.freeze_reason,
    cachedAt: now,
  });

  return state;
}

/**
 * Invalidate cache for a tenant
 * Call this when freeze state changes (freeze/unfreeze operations)
 */
export function invalidateTenantFreezeCache(tenantId: string): void {
  cache.delete(tenantId);
}

/**
 * Clear all cached governance state
 * Useful for testing or emergency cache flush
 */
export function clearGovernanceCache(): void {
  cache.clear();
}

/**
 * Get cache statistics
 */
export function getGovernanceCacheStats(): {
  size: number;
  entries: Array<{ tenantId: string; frozen: boolean; age: number }>;
} {
  const now = Date.now();
  return {
    size: cache.size,
    entries: Array.from(cache.entries()).map(([tenantId, entry]) => ({
      tenantId,
      frozen: entry.frozen,
      age: now - entry.cachedAt,
    })),
  };
}
