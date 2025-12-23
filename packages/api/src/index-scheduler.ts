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

import { PrismaClient } from '@prisma/client';
import { getJobSchedulerService } from './infrastructure/jobs/scheduler-service';

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
    console.log('[Scheduler] Starting job scheduler service...');
    await scheduler.start();
    console.log('[Scheduler] Job scheduler service started successfully');
    console.log('[Scheduler] Status:', scheduler.getStatus());
  } catch (error) {
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
