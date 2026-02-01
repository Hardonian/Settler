/**
 * Request Idempotency
 *
 * Ensures operations can be safely retried without side effects.
 * Uses database-backed idempotency keys.
 */

import { prisma } from '@/shared/db/prismaClient';
import crypto from 'crypto';
import { safeJsonParse } from '@/lib/utils/safe-parse';

interface IdempotencyRecord {
  id: string;
  key: string;
  status: 'pending' | 'completed' | 'failed';
  response?: unknown;
  createdAt: Date;
  completedAt?: Date;
}

const IDEMPOTENCY_KEY_HEADER = 'Idempotency-Key';
const IDEMPOTENCY_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate idempotency key from request
 */
export function getIdempotencyKey(request: Request): string | null {
  const headerKey = request.headers.get(IDEMPOTENCY_KEY_HEADER);
  if (headerKey) return headerKey;

  // Generate from request body and path for POST/PUT/PATCH
  const method = request.method;
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const url = new URL(request.url);
    return crypto
      .createHash('sha256')
      .update(`${method}:${url.pathname}`)
      .digest('hex')
      .substring(0, 32);
  }

  return null;
}

/**
 * Check if request was already processed
 */
export async function checkIdempotency(key: string): Promise<IdempotencyRecord | null> {
  try {
    // Clean up old records
    const cutoff = new Date(Date.now() - IDEMPOTENCY_TTL);
    await prisma.idempotencyKey.deleteMany({
      where: {
        createdAt: {
          lt: cutoff,
        },
      },
    });

    const record = await prisma.idempotencyKey.findUnique({
      where: { key },
    });

    if (!record) return null;

    return {
      id: record.id,
      key: record.key,
      status: record.status as 'pending' | 'completed' | 'failed',
      response: record.response as unknown,
      createdAt: record.createdAt,
      completedAt: record.completedAt || undefined,
    };
  } catch (_error) {
    console.error('[Idempotency] Error checking idempotency:', error);
    // On error, allow request to proceed (fail open)
    return null;
  }
}

/**
 * Record idempotency key
 */
export async function recordIdempotency(
  key: string,
  status: 'pending' | 'completed' | 'failed',
  response?: unknown
): Promise<void> {
  try {
    const responseJson = response
      ? (typeof response === 'string' ? safeJsonParse(response, "idempotency response") : response)
      : null;
    const expiresAt = new Date(Date.now() + IDEMPOTENCY_TTL);
    
    await prisma.idempotencyKey.upsert({
      where: { key },
      create: {
        key,
        status,
        response: responseJson as any,
        completedAt: status !== 'pending' ? new Date() : null,
        expiresAt,
      },
      update: {
        status,
        response: responseJson as any,
        completedAt: status !== 'pending' ? new Date() : null,
      },
    });
  } catch (_error) {
    console.error('[Idempotency] Error recording idempotency:', error);
    // Don't throw - idempotency is best effort
  }
}

/**
 * Wrap handler with idempotency protection
 */
export function withIdempotency(
  handler: (request: Request) => Promise<Response>,
  options: { required?: boolean } = {}
) {
  return async (request: Request): Promise<Response> => {
    const key = getIdempotencyKey(request);

    if (!key) {
      if (options.required) {
        return new Response(
          JSON.stringify({ error: 'Idempotency-Key header required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return handler(request);
    }

    // Check if already processed
    const existing = await checkIdempotency(key);
    if (existing) {
      if (existing.status === 'completed' && existing.response) {
        return new Response(JSON.stringify(existing.response), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-Idempotency-Replayed': 'true',
          },
        });
      }
      if (existing.status === 'pending') {
        // Request in progress - return 409 Conflict
        return new Response(
          JSON.stringify({ error: 'Request already in progress' }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Record as pending
    await recordIdempotency(key, 'pending');

    try {
      const response = await handler(request);
      const responseClone = response.clone();
      const responseData = await responseClone.json().catch(() => ({}));

      // Record success
      await recordIdempotency(key, 'completed', responseData);

      // Add idempotency header to response
      const headers = new Headers(response.headers);
      headers.set('X-Idempotency-Key', key);
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (_error) {
      // Record failure
      await recordIdempotency(key, 'failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  };
}
