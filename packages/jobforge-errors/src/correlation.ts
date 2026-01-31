import { randomUUID } from 'crypto'

/**
 * Generate a unique correlation ID for request tracing.
 * Uses UUID v4 for global uniqueness.
 */
export function generateCorrelationId(): string {
  return randomUUID()
}

/**
 * Extract correlation ID from headers (case-insensitive).
 * Common header names: X-Correlation-ID, X-Request-ID, X-Trace-ID
 */
export function extractCorrelationId(
  headers: Record<string, string | string[] | undefined>
): string | undefined {
  const headerNames = ['x-correlation-id', 'x-request-id', 'x-trace-id']

  for (const name of headerNames) {
    const value = headers[name]
    if (typeof value === 'string' && value.length > 0) {
      return value
    }
    if (Array.isArray(value) && value[0]) {
      return value[0]
    }
  }

  return undefined
}

/**
 * Correlation ID storage using AsyncLocalStorage for Node.js
 * This allows accessing the correlation ID anywhere in the request context
 */
let correlationStorage: {
  getStore: () => string | undefined
  run: <T>(correlationId: string, callback: () => T) => T
} | null = null

try {
  // AsyncLocalStorage is available in Node.js 12.17.0+
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { AsyncLocalStorage } = require('async_hooks') as {
    AsyncLocalStorage: new <T>() => {
      getStore: () => T | undefined
      run: <R>(store: T, callback: () => R) => R
    }
  }
  const storage = new AsyncLocalStorage()

  correlationStorage = {
    getStore: (): string | undefined => storage.getStore() as string | undefined,
    run: <T>(correlationId: string, callback: () => T): T => storage.run(correlationId, callback),
  }
} catch {
  // Fallback for environments without AsyncLocalStorage (e.g., edge runtime)
  correlationStorage = {
    getStore: () => undefined,
    run: <T>(_correlationId: string, callback: () => T): T => callback(),
  }
}

/**
 * Get the current correlation ID from async context
 */
export function getCurrentCorrelationId(): string | undefined {
  return correlationStorage?.getStore()
}

/**
 * Run a function with a correlation ID in async context
 */
export function runWithCorrelationId<T>(correlationId: string, callback: () => T): T {
  if (!correlationStorage) {
    return callback()
  }
  return correlationStorage.run(correlationId, callback)
}
