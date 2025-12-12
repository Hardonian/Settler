/**
 * API Timeout Middleware
 * 
 * Ensures API routes have appropriate timeout configuration.
 * Prevents long-running requests from blocking the server.
 */

import { NextRequest } from 'next/server';

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_TIMEOUT = 300000; // 5 minutes (Vercel limit)

interface TimeoutConfig {
  timeout?: number;
  timeoutMessage?: string;
}

/**
 * Create a timeout promise that rejects after specified time
 */
function createTimeout(timeoutMs: number, message: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);
  });
}

/**
 * Wrap a handler with timeout protection
 */
export function withTimeout<T>(
  handler: (request: NextRequest) => Promise<T>,
  config: TimeoutConfig = {}
): (request: NextRequest) => Promise<T> {
  const timeout = Math.min(config.timeout || DEFAULT_TIMEOUT, MAX_TIMEOUT);
  const timeoutMessage = config.timeoutMessage || `Request timed out after ${timeout}ms`;

  return async (request: NextRequest) => {
    return Promise.race([
      handler(request),
      createTimeout(timeout, timeoutMessage),
    ]);
  };
}

/**
 * Get timeout configuration for route type
 */
export function getTimeoutForRoute(routeType: 'api' | 'webhook' | 'cron' | 'health'): number {
  switch (routeType) {
    case 'webhook':
      return 30000; // 30 seconds
    case 'cron':
      return 300000; // 5 minutes
    case 'health':
      return 10000; // 10 seconds
    case 'api':
    default:
      return 30000; // 30 seconds
  }
}
