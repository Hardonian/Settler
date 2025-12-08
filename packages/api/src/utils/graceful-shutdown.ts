/**
 * Graceful Shutdown Handler
 * Ensures clean shutdown of server, database connections, and background jobs
 */

import { Server } from 'http';
import { pool } from '../db';
import { close as closeCache } from './cache';
import { logInfo, logError } from './logger';

interface ShutdownOptions {
  server: Server;
  timeout?: number;
  onShutdown?: () => Promise<void>;
}

let shutdownInProgress = false;
let shutdownHandlers: Array<() => Promise<void>> = [];

/**
 * Register a shutdown handler
 */
export function registerShutdownHandler(handler: () => Promise<void>): void {
  shutdownHandlers.push(handler);
}

/**
 * Gracefully shutdown the application
 */
export async function gracefulShutdown(options: ShutdownOptions): Promise<void> {
  if (shutdownInProgress) {
    logInfo('Shutdown already in progress');
    return;
  }

  shutdownInProgress = true;
  const timeout = options.timeout || 30000; // 30 seconds default
  const startTime = Date.now();

  logInfo('Starting graceful shutdown...');

  try {
    // 1. Stop accepting new requests
    logInfo('Closing HTTP server...');
    await new Promise<void>((resolve, reject) => {
      options.server.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    logInfo('HTTP server closed');

    // 2. Wait for ongoing requests to complete (with timeout)
    const remainingTime = timeout - (Date.now() - startTime);
    if (remainingTime > 0) {
      logInfo(`Waiting up to ${remainingTime}ms for ongoing requests...`);
      await new Promise(resolve => setTimeout(resolve, Math.min(remainingTime, 5000)));
    }

    // 3. Execute custom shutdown handlers
    logInfo(`Executing ${shutdownHandlers.length} shutdown handlers...`);
    await Promise.allSettled(
      shutdownHandlers.map(async (handler) => {
        try {
          await handler();
        } catch (error) {
          logError('Shutdown handler failed', error);
        }
      })
    );

    // 4. Close database connections
    logInfo('Closing database connections...');
    await pool.end();
    logInfo('Database connections closed');

    // 5. Close cache connections
    logInfo('Closing cache connections...');
    await closeCache();
    logInfo('Cache connections closed');

    // 6. Execute custom onShutdown callback
    if (options.onShutdown) {
      logInfo('Executing custom shutdown callback...');
      await options.onShutdown();
    }

    const duration = Date.now() - startTime;
    logInfo(`Graceful shutdown completed in ${duration}ms`);
  } catch (error) {
    logError('Error during graceful shutdown', error);
    throw error;
  }
}

/**
 * Setup signal handlers for graceful shutdown
 */
export function setupSignalHandlers(server: Server, options?: Partial<ShutdownOptions>): void {
  const shutdown = async (signal: string) => {
    logInfo(`Received ${signal}, starting graceful shutdown...`);
    try {
      await gracefulShutdown({
        server,
        ...options,
      });
      process.exit(0);
    } catch (error) {
      logError('Error during shutdown', error);
      process.exit(1);
    }
  };

  // Handle SIGTERM (used by Docker, Kubernetes, etc.)
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logError('Uncaught exception', error);
    shutdown('uncaughtException').finally(() => {
      process.exit(1);
    });
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logError('Unhandled promise rejection', { reason, promise });
    shutdown('unhandledRejection').finally(() => {
      process.exit(1);
    });
  });
}
