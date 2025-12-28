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
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - PrismaClient is generated at build time
const client_1 = require("@prisma/client");
const scheduler_service_1 = require("./infrastructure/jobs/scheduler-service");
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
        console.log('[Scheduler] Starting job scheduler service...');
        await scheduler.start();
        console.log('[Scheduler] Job scheduler service started successfully');
        console.log('[Scheduler] Status:', scheduler.getStatus());
    }
    catch (error) {
        console.error('[Scheduler] Failed to start:', error);
        process.exit(1);
    }
}
/**
 * Graceful shutdown
 */
async function shutdown() {
    console.log('[Scheduler] Shutting down...');
    await scheduler.stop();
    await prisma.$disconnect();
    console.log('[Scheduler] Shutdown complete');
    process.exit(0);
}
// Handle shutdown signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('uncaughtException', (error) => {
    console.error('[Scheduler] Uncaught exception:', error);
    shutdown();
});
// Start scheduler
start().catch((error) => {
    console.error('[Scheduler] Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=index-scheduler.js.map