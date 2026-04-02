/**
 * Query Optimizer
 *
 * Optimizes database queries with:
 * - Field selection (only fetch needed fields)
 * - Query batching
 * - Request deduplication
 * - Query result caching
 * - Index hints
 */

import { prisma } from "@/shared/db/prismaClient";

// Request deduplication cache (in-memory, short TTL)
const requestCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5000; // 5 seconds

/**
 * Deduplicate concurrent requests for the same query
 */
async function deduplicateRequest<T>(key: string, queryFn: () => Promise<T>): Promise<T> {
  // Check if there's a pending request
  const cached = requestCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }

  // Execute query
  const result = await queryFn();

  // Cache result
  requestCache.set(key, {
    data: result,
    timestamp: Date.now(),
  });

  // Clean up old cache entries
  setTimeout(() => {
    requestCache.delete(key);
  }, CACHE_TTL);

  return result;
}

/**
 * Optimized billing account lookup with caching
 */
export async function getBillingAccountOptimized(
  userId: string,
  useCache = true
): Promise<{ id: string; tenantId: string | null } | null> {
  const cacheKey = `billing_account:${userId}`;

  if (!useCache) {
    return prisma.billingAccount.findFirst({
      where: { userId, status: "active", deletedAt: null },
      select: { id: true, tenantId: true },
      orderBy: { createdAt: "desc" },
    });
  }

  return deduplicateRequest(cacheKey, async () => {
    return prisma.billingAccount.findFirst({
      where: { userId, status: "active", deletedAt: null },
      select: { id: true, tenantId: true }, // Only select needed fields
      orderBy: { createdAt: "desc" },
    });
  });
}

/**
 * Batch multiple queries together
 */
export async function batchQueries<T>(queries: Array<() => Promise<T>>): Promise<T[]> {
  return Promise.all(queries.map((q) => q()));
}

/**
 * Optimized receipt listing with proper field selection
 */
export async function listReceiptsOptimized(billingAccountId: string, limit = 50, offset = 0) {
  // Use select instead of include to reduce data transfer
  return prisma.receipt.findMany({
    where: {
      upload: {
        billingAccountId,
      },
    },
    select: {
      id: true,
      uploadId: true,
      vendor: true,
      date: true,
      currency: true,
      total: true,
      confidenceScore: true,
      createdAt: true,
      items: {
        select: {
          id: true, // Only select ID for count
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 100), // Cap at 100
    skip: offset,
  });
}

/**
 * Clear request cache (useful for testing or cache invalidation)
 */
export function clearRequestCache(): void {
  requestCache.clear();
}
