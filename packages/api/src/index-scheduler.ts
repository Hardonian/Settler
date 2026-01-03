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

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - PrismaClient is generated at build time
import { PrismaClient } from '@prisma/client';
import { getJobSchedulerService } from './infrastructure/jobs/scheduler-service';
import { logInfo, logError } from './utils/logger';

// Initialize Prisma client
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// Initialize scheduler
const scheduler = getJobSchedulerService(prisma);

/**
 * Start scheduler
 */
async function start() {
  try {
    logInfo('[Scheduler] Starting job scheduler service...');
    await scheduler.start();
    logInfo('[Scheduler] Job scheduler service started successfully', { status: scheduler.getStatus() });
  } catch (error) {
    logError('[Scheduler] Failed to start', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
async function shutdown() {
  logInfo('[Scheduler] Shutting down...');
  await scheduler.stop();
  await prisma.$disconnect();
  logInfo('[Scheduler] Shutdown complete');
  process.exit(0);
}

// Handle shutdown signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('uncaughtException', (error) => {
  logError('[Scheduler] Uncaught exception', error);
  shutdown();
});

// Start scheduler
start().catch((error) => {
  logError('[Scheduler] Fatal error', error);
  process.exit(1);
});
