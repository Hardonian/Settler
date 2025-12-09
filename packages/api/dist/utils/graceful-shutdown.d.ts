/**
 * Graceful Shutdown Handler
 * Ensures clean shutdown of server, database connections, and background jobs
 */
import { Server } from 'http';
interface ShutdownOptions {
    server: Server;
    timeout?: number;
    onShutdown?: () => Promise<void>;
}
/**
 * Register a shutdown handler
 */
export declare function registerShutdownHandler(handler: () => Promise<void>): void;
/**
 * Gracefully shutdown the application
 */
export declare function gracefulShutdown(options: ShutdownOptions): Promise<void>;
/**
 * Setup signal handlers for graceful shutdown
 */
export declare function setupSignalHandlers(server: Server, options?: Partial<ShutdownOptions>): void;
export {};
//# sourceMappingURL=graceful-shutdown.d.ts.map