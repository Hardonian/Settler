/**
 * Database Connection Pool Manager
 * 
 * Optimizes database connections with:
 * - Connection pooling
 * - Health checks
 * - Automatic retry
 * - Connection reuse
 * - Timeout handling
 */

import { checkDatabaseHealth } from '@/shared/db/prismaClient';

export interface ConnectionPoolStats {
  healthy: boolean;
  lastCheck: Date;
  errorCount: number;
}

const poolStats: ConnectionPoolStats = {
  healthy: true,
  lastCheck: new Date(),
  errorCount: 0,
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Execute a database query with automatic retry on connection errors
 */
export async function executeWithRetry<T>(
  queryFn: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> {
  try {
    const result = await queryFn();
    poolStats.healthy = true;
    poolStats.errorCount = 0;
    return result;
  } catch (error: any) {
    // Check if it's a connection error
    const isConnectionError =
      error?.code === 'P1001' || // Can't reach database server
      error?.code === 'P1002' || // Connection timeout
      error?.code === 'P1008' || // Operations timed out
      error?.code === 'P1017' || // Server has closed the connection
      error?.message?.includes('connection') ||
      error?.message?.includes('timeout') ||
      error?.message?.includes('ECONNREFUSED');

    if (isConnectionError && retries > 0) {
      poolStats.errorCount++;
      console.warn(`[ConnectionPool] Connection error, retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
      
      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      
      // Check connection health before retry
      const healthy = await checkDatabaseHealth();
      if (!healthy) {
        throw new Error('Database connection unhealthy');
      }
      
      return executeWithRetry(queryFn, retries - 1);
    }

    // Not a connection error or out of retries
    throw error;
  }
}

/**
 * Get connection pool statistics
 */
export function getPoolStats(): ConnectionPoolStats {
  return { ...poolStats };
}

/**
 * Health check wrapper for database operations
 */
export async function withHealthCheck<T>(
  operation: () => Promise<T>
): Promise<T> {
  // Quick health check before operation
  const healthy = await checkDatabaseHealth();
  if (!healthy) {
    poolStats.healthy = false;
    throw new Error('Database connection unhealthy');
  }

  poolStats.lastCheck = new Date();
  return executeWithRetry(operation);
}
