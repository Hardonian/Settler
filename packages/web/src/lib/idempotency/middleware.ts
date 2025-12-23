/**
 * Idempotency Middleware
 * 
 * Express-style middleware for Next.js API routes to handle idempotency.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateIdempotencyKey, IdempotencyKeyOptions } from './key';
import {
  checkIdempotencyKey,
  createIdempotencyKey,
  completeIdempotencyKey,
  failIdempotencyKey,
} from './store';

export interface IdempotencyMiddlewareOptions {
  operation: string;
  timeWindow?: number;
  getTenantId: (request: NextRequest) => Promise<string | null>;
  getUserId?: (request: NextRequest) => Promise<string | null>;
  getPayload?: (request: NextRequest) => Promise<Record<string, unknown>>;
}

/**
 * Wrap an API handler with idempotency protection
 */
export function withIdempotency<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>,
  options: IdempotencyMiddlewareOptions
) {
  return async (...args: T): Promise<NextResponse> => {
    const request = args[0] as NextRequest;
    let idempotencyKey: string | null = null;

    try {
      // Get tenant ID (required)
      const tenantId = await options.getTenantId(request);
      if (!tenantId) {
        // No tenant ID - skip idempotency (e.g., public routes)
        return handler(...args);
      }

      // Get user ID (optional)
      const userId = options.getUserId
        ? await options.getUserId(request)
        : null;

      // Get payload for key generation
      const payload = options.getPayload
        ? await options.getPayload(request)
        : {};

      // Generate idempotency key
      const keyOptions: IdempotencyKeyOptions = {
        tenantId,
        operation: options.operation,
        timeWindow: options.timeWindow,
        payload,
        userId: userId || undefined,
      };
      idempotencyKey = generateIdempotencyKey(keyOptions);

      // Check if key exists
      const checkResult = await checkIdempotencyKey(idempotencyKey);
      if (checkResult.isDuplicate) {
        if (checkResult.existingResponse) {
          // Return cached response
          return NextResponse.json(checkResult.existingResponse);
        }
        // Request in progress - return 409 Conflict
        return NextResponse.json(
          {
            error: 'IDEMPOTENCY_CONFLICT',
            message: 'A request with the same parameters is already in progress',
            retryAfter: 5, // seconds
          },
          { status: 409 }
        );
      }

      // Create idempotency key record
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + (options.timeWindow || 60));
      await createIdempotencyKey(idempotencyKey, expiresAt);

      // Execute handler
      const response = await handler(...args);

      // If successful, cache response
      if (response.status >= 200 && response.status < 300) {
        try {
          const responseBody = await response.clone().json().catch(() => null);
          if (responseBody) {
            await completeIdempotencyKey(idempotencyKey, responseBody);
          }
        } catch {
          // Ignore errors caching response
        }
      } else {
        // Not successful - mark as failed to allow retry
        await failIdempotencyKey(idempotencyKey);
      }

      return response;
    } catch (error) {
      // On error, mark idempotency key as failed
      if (idempotencyKey) {
        await failIdempotencyKey(idempotencyKey).catch(() => {
          // Ignore
        });
      }

      // Re-throw to let error handler deal with it
      throw error;
    }
  };
}
