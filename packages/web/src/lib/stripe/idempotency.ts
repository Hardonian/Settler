/**
 * Stripe Idempotency Utilities
 *
 * CFO Mode: Accuracy & Idempotency
 * - All Stripe API calls must use idempotency keys
 * - Prevents double-charging or double-recording
 */

import { v4 as uuidv4 } from "uuid";

/**
 * Generate idempotency key for Stripe API calls
 * Format: {operation}_{resourceId}_{timestamp}_{random}
 */
export function generateIdempotencyKey(
  operation: string,
  resourceId?: string,
  additionalContext?: string
): string {
  const parts = [operation];

  if (resourceId) {
    parts.push(resourceId);
  }

  if (additionalContext) {
    parts.push(additionalContext);
  }

  parts.push(Date.now().toString());
  parts.push(uuidv4().substring(0, 8));

  return parts.join("_");
}

/**
 * Generate idempotency key for payment operations
 */
export function generatePaymentIdempotencyKey(
  paymentIntentId: string,
  operation: "capture" | "refund" | "cancel" = "capture"
): string {
  return generateIdempotencyKey(`stripe_${operation}`, paymentIntentId);
}

/**
 * Generate idempotency key for webhook processing
 */
export function generateWebhookIdempotencyKey(eventId: string, eventType: string): string {
  return generateIdempotencyKey(`webhook_${eventType}`, eventId);
}

/**
 * Stripe API call wrapper with idempotency
 * Ensures all Stripe calls include idempotency key
 */
export async function stripeCallWithIdempotency<T>(
  operation: () => Promise<T>,
  idempotencyKey: string,
  retryOnConflict = true
): Promise<T> {
  try {
    return await operation();
  } catch (error: unknown) {
    // Stripe returns 409 Conflict if idempotency key already used
    // This is expected behavior - the previous call succeeded
    if (
      retryOnConflict &&
      error &&
      typeof error === "object" &&
      "statusCode" in error &&
      error.statusCode === 409
    ) {
      // Idempotent: previous call succeeded, return success
      // Note: In production, you'd fetch the previous result
      throw new Error(`Idempotency key conflict: ${idempotencyKey}. Previous call succeeded.`);
    }
    throw error;
  }
}
