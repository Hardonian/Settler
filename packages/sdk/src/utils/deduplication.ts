/**
 * Request deduplication utility to prevent duplicate in-flight requests
 */

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

const pendingRequests = new Map<string, PendingRequest<unknown>>();
const REQUEST_TIMEOUT = 60000; // 60 seconds
/** Prevent unbounded growth if many unique in-flight keys appear before TTL */
const MAX_PENDING_ENTRIES = 5000;

/**
 * Generates a unique key for a request based on method, path, and body
 */
function generateRequestKey(method: string, path: string, body?: unknown): string {
  const bodyHash = body ? JSON.stringify(body) : "";
  return `${method}:${path}:${bodyHash}`;
}

/**
 * Cleans up stale pending requests
 */
function cleanupStaleRequests(): void {
  const now = Date.now();
  for (const [key, request] of pendingRequests.entries()) {
    if (now - request.timestamp > REQUEST_TIMEOUT) {
      pendingRequests.delete(key);
    }
  }
}

function evictIfOverCapacity(): void {
  if (pendingRequests.size <= MAX_PENDING_ENTRIES) {
    return;
  }
  const overflow = pendingRequests.size - MAX_PENDING_ENTRIES;
  const entries = [...pendingRequests.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
  for (let i = 0; i < overflow && i < entries.length; i++) {
    pendingRequests.delete(entries[i]![0]);
  }
}

/**
 * Executes a function with request deduplication
 * If the same request is already in-flight, returns the existing promise
 */
export async function withDeduplication<T>(
  method: string,
  path: string,
  body: unknown,
  fn: () => Promise<T>
): Promise<T> {
  cleanupStaleRequests();
  evictIfOverCapacity();

  const key = generateRequestKey(method, path, body);
  const existing = pendingRequests.get(key);

  if (existing) {
    return existing.promise as Promise<T>;
  }

  const promise = fn().finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, {
    promise,
    timestamp: Date.now(),
  });

  return promise;
}

/**
 * Clears all pending requests (useful for testing)
 */
export function clearPendingRequests(): void {
  pendingRequests.clear();
}
