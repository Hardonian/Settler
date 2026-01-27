/**
 * Console Route Optimizer
 * 
 * Provides optimized utilities for console API routes:
 * - Billing account caching
 * - Query batching
 * - Request deduplication
 * - Error recovery
 */

import { UnifiedAuthContext } from './unified-auth';
import { getBillingAccountOptimized } from '@/lib/db/query-optimizer';
import { executeWithRetry } from '@/lib/db/connection-pool';
import { prisma } from '@/shared/db/prismaClient';

/**
 * Get billing account ID from auth context or database
 * Optimized with caching and connection pooling
 */
export async function getBillingAccountId(
  authContext: UnifiedAuthContext
): Promise<string | null> {
  // Use cached billing account ID if available
  if (authContext.billingAccountId) {
    return authContext.billingAccountId;
  }

  // Lookup billing account with caching
  const billingAccount = await getBillingAccountOptimized(authContext.userId, true);
  return billingAccount?.id || null;
}

/**
 * Verify billing account access with optimized query
 */
export async function verifyBillingAccountAccessOptimized(
  billingAccountId: string,
  userId: string
): Promise<boolean> {
  try {
    const billingAccount = await executeWithRetry(() =>
      prisma.billingAccount.findFirst({
        where: {
          id: billingAccountId,
          userId,
        },
        select: {
          id: true,
          userId: true,
        },
      })
    );

    return !!billingAccount && billingAccount.userId === userId;
  } catch {
    console.error('[verifyBillingAccountAccessOptimized] Error:', error);
    return false;
  }
}

/**
 * Batch multiple database operations
 */
export async function batchOperations<T>(
  operations: Array<() => Promise<T>>
): Promise<T[]> {
  return Promise.all(operations.map((op) => executeWithRetry(op)));
}
