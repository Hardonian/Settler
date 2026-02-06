"use strict";
/**
 * Scheduler Service Entry Point
 *
 * Initializes and starts the job scheduler service.
 * Run this as a separate process or integrate into main application.
 *
 * Usage:
 *   tsx src/index-scheduler.ts
 *   or
 *   node dist/index-scheduler.js
 */
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const scheduler_service_1 = require("./infrastructure/jobs/scheduler-service");
const logger_1 = require("./utils/logger");
// Initialize Prisma client
const prisma = new client_1.PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});
// Initialize scheduler
const scheduler = (0, scheduler_service_1.getJobSchedulerService)(prisma);
/**
 * Start scheduler
 */
async function start() {
    try {
        (0, logger_1.logInfo)('[Scheduler] Starting job scheduler service...');
        await scheduler.start();
        (0, logger_1.logInfo)('[Scheduler] Job scheduler service started successfully', { status: scheduler.getStatus() });
    }
    catch (error) {
        (0, logger_1.logError)('[Scheduler] Failed to start', error);
        process.exit(1);
    }
}
/**
 * Graceful shutdown
 */
async function shutdown() {
    (0, logger_1.logInfo)('[Scheduler] Shutting down...');
    await scheduler.stop();
    await prisma.$disconnect();
    (0, logger_1.logInfo)('[Scheduler] Shutdown complete');
    process.exit(0);
}
// Handle shutdown signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('uncaughtException', (error) => {
    (0, logger_1.logError)('[Scheduler] Uncaught exception', error);
    shutdown();
});
// Start scheduler
start().catch((error) => {
    (0, logger_1.logError)('[Scheduler] Fatal error', error);
    process.exit(1);
});
//# sourceMappingURL=index-scheduler.js.map