"use strict";
/**
 * Graceful Shutdown Handler
 * Ensures clean shutdown of server, database connections, and background jobs
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerShutdownHandler = registerShutdownHandler;
exports.gracefulShutdown = gracefulShutdown;
exports.setupSignalHandlers = setupSignalHandlers;
const db_1 = require("../db");
const cache_1 = require("./cache");
const logger_1 = require("./logger");
let shutdownInProgress = false;
let shutdownHandlers = [];
/**
 * Register a shutdown handler
 */
function registerShutdownHandler(handler) {
    shutdownHandlers.push(handler);
}
/**
 * Gracefully shutdown the application
 */
async function gracefulShutdown(options) {
    if (shutdownInProgress) {
        (0, logger_1.logInfo)('Shutdown already in progress');
        return;
    }
    shutdownInProgress = true;
    const timeout = options.timeout || 30000; // 30 seconds default
    const startTime = Date.now();
    (0, logger_1.logInfo)('Starting graceful shutdown...');
    try {
        // 1. Stop accepting new requests
        (0, logger_1.logInfo)('Closing HTTP server...');
        await new Promise((resolve, reject) => {
            options.server.close((err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
        (0, logger_1.logInfo)('HTTP server closed');
        // 2. Wait for ongoing requests to complete (with timeout)
        const remainingTime = timeout - (Date.now() - startTime);
        if (remainingTime > 0) {
            (0, logger_1.logInfo)(`Waiting up to ${remainingTime}ms for ongoing requests...`);
            await new Promise(resolve => setTimeout(resolve, Math.min(remainingTime, 5000)));
        }
        // 3. Execute custom shutdown handlers
        (0, logger_1.logInfo)(`Executing ${shutdownHandlers.length} shutdown handlers...`);
        await Promise.allSettled(shutdownHandlers.map(async (handler) => {
            try {
                await handler();
            }
            catch (error) {
                (0, logger_1.logError)('Shutdown handler failed', error);
            }
        }));
        // 4. Close database connections
        (0, logger_1.logInfo)('Closing database connections...');
        await db_1.pool.end();
        (0, logger_1.logInfo)('Database connections closed');
        // 5. Close cache connections
        (0, logger_1.logInfo)('Closing cache connections...');
        await (0, cache_1.close)();
        (0, logger_1.logInfo)('Cache connections closed');
        // 6. Execute custom onShutdown callback
        if (options.onShutdown) {
            (0, logger_1.logInfo)('Executing custom shutdown callback...');
            await options.onShutdown();
        }
        const duration = Date.now() - startTime;
        (0, logger_1.logInfo)(`Graceful shutdown completed in ${duration}ms`);
    }
    catch (error) {
        (0, logger_1.logError)('Error during graceful shutdown', error);
        throw error;
    }
}
/**
 * Setup signal handlers for graceful shutdown
 */
function setupSignalHandlers(server, options) {
    const shutdown = async (signal) => {
        (0, logger_1.logInfo)(`Received ${signal}, starting graceful shutdown...`);
        try {
            await gracefulShutdown({
                server,
                ...options,
            });
            process.exit(0);
        }
        catch (error) {
            (0, logger_1.logError)('Error during shutdown', error);
            process.exit(1);
        }
    };
    // Handle SIGTERM (used by Docker, Kubernetes, etc.)
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    // Handle SIGINT (Ctrl+C)
    process.on('SIGINT', () => shutdown('SIGINT'));
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
        (0, logger_1.logError)('Uncaught exception', error);
        shutdown('uncaughtException').finally(() => {
            process.exit(1);
        });
    });
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
        (0, logger_1.logError)('Unhandled promise rejection', { reason, promise });
        shutdown('unhandledRejection').finally(() => {
            process.exit(1);
        });
    });
}
//# sourceMappingURL=graceful-shutdown.js.map