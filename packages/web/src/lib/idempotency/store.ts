/**
 * Idempotency Key Storage & Lookup
 * 
 * Manages idempotency keys in the database to prevent duplicate operations.
 */

import { prisma } from '@/shared/db/prismaClient';
import { IdempotencyKey, Prisma } from '@prisma/client';

export interface IdempotencyResult<T = unknown> {
  isDuplicate: boolean;
  existingResponse?: T;
  key: string;
}

/**
 * Check if an idempotency key exists and return cached response if available
 */
export async function checkIdempotencyKey<T = unknown>(
  key: string
): Promise<IdempotencyResult<T>> {
  try {
    const record = await prisma.idempotencyKey.findUnique({
      where: { key },
    });

    if (!record) {
      return { isDuplicate: false, key };
    }

    // Check if expired
    if (record.expiresAt < new Date()) {
      // Clean up expired key
      await prisma.idempotencyKey.delete({
        where: { key },
      }).catch(() => {
        // Ignore cleanup errors
      });
      return { isDuplicate: false, key };
    }

    // If completed, return cached response
    if (record.status === 'completed' && record.response) {
      return {
        isDuplicate: true,
        existingResponse: record.response as T,
        key,
      };
    }

    // If pending, it's a duplicate request in progress
    if (record.status === 'pending') {
      return {
        isDuplicate: true,
        key,
      };
    }

    // Failed - allow retry
    return { isDuplicate: false, key };
  } catch {
    // On error, assume not duplicate (fail open)
    console.error('[Idempotency] Error checking key:', error);
    return { isDuplicate: false, key };
  }
}

/**
 * Create or update an idempotency key record
 */
export async function createIdempotencyKey(
  key: string,
  expiresAt: Date
): Promise<IdempotencyKey | null> {
  try {
    // Try to create, or get existing
    const record = await prisma.idempotencyKey.upsert({
      where: { key },
      create: {
        key,
        status: 'pending',
        expiresAt,
      },
      update: {
        // Don't update if already exists
      },
    });

    return record;
  } catch {
    // If unique constraint violation, key already exists
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return null; // Already exists
    }
    console.error('[Idempotency] Error creating key:', error);
    return null;
  }
}

/**
 * Mark an idempotency key as completed with response
 */
export async function completeIdempotencyKey<T = unknown>(
  key: string,
  response: T
): Promise<void> {
  try {
    await prisma.idempotencyKey.update({
      where: { key },
      data: {
        status: 'completed',
        response: response as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    });
  } catch {
    console.error('[Idempotency] Error completing key:', error);
    // Don't throw - idempotency is best-effort
  }
}

/**
 * Mark an idempotency key as failed
 */
export async function failIdempotencyKey(key: string): Promise<void> {
  try {
    await prisma.idempotencyKey.update({
      where: { key },
      data: {
        status: 'failed',
      },
    });
  } catch {
    console.error('[Idempotency] Error failing key:', error);
    // Don't throw
  }
}

/**
 * Clean up expired idempotency keys (should be run periodically)
 */
export async function cleanupExpiredIdempotencyKeys(): Promise<number> {
  try {
    const result = await prisma.idempotencyKey.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  } catch {
    console.error('[Idempotency] Error cleaning up expired keys:', error);
    return 0;
  }
}
