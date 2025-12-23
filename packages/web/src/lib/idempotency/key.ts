/**
 * Idempotency Key Generation & Validation
 * 
 * Generates deterministic idempotency keys for operations to prevent duplicate effects.
 */

import { createHash } from 'crypto';

export interface IdempotencyKeyOptions {
  tenantId: string;
  operation: string;
  timeWindow?: number; // Minutes - defaults to 60
  payload?: Record<string, unknown>;
  userId?: string;
}

/**
 * Generate a deterministic idempotency key
 * 
 * Format: {tenantId}:{operation}:{timeWindow}:{payloadHash}
 * 
 * This ensures:
 * - Same operation + payload in same window = same key
 * - Different tenants = different keys
 * - Different time windows = different keys (allows retries after window expires)
 */
export function generateIdempotencyKey(options: IdempotencyKeyOptions): string {
  const {
    tenantId,
    operation,
    timeWindow = 60, // 60 minutes default
    payload = {},
    userId,
  } = options;

  // Round to time window to ensure same key within window
  const now = Date.now();
  const windowStart = Math.floor(now / (timeWindow * 60 * 1000)) * (timeWindow * 60 * 1000);

  // Create deterministic payload hash
  const payloadStr = JSON.stringify(payload, Object.keys(payload).sort());
  const payloadHash = createHash('sha256')
    .update(payloadStr)
    .digest('hex')
    .substring(0, 16); // First 16 chars for brevity

  // Build key components
  const components = [
    tenantId,
    operation,
    windowStart.toString(),
    payloadHash,
  ];

  if (userId) {
    components.push(userId);
  }

  return components.join(':');
}

/**
 * Parse an idempotency key to extract components
 */
export function parseIdempotencyKey(key: string): {
  tenantId: string;
  operation: string;
  timeWindow: number;
  payloadHash: string;
  userId?: string;
} | null {
  const parts = key.split(':');
  if (parts.length < 4) {
    return null;
  }

  const [tenantId, operation, windowStartStr, payloadHash, ...rest] = parts;
  
  if (!tenantId || !operation || !windowStartStr || !payloadHash) {
    return null;
  }
  
  const userId = rest.length > 0 ? rest.join(':') : undefined;

  return {
    tenantId,
    operation,
    timeWindow: parseInt(windowStartStr, 10),
    payloadHash,
    userId,
  };
}

/**
 * Check if an idempotency key is still valid (within time window)
 */
export function isIdempotencyKeyValid(
  key: string,
  timeWindowMinutes: number = 60
): boolean {
  const parsed = parseIdempotencyKey(key);
  if (!parsed) {
    return false;
  }

  const now = Date.now();
  const windowStart = parsed.timeWindow;
  const windowEnd = windowStart + timeWindowMinutes * 60 * 1000;

  return now >= windowStart && now <= windowEnd;
}
