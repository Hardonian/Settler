/**
 * Job Scheduler Service - Production Ready
 *
 * Executes scheduled reconciliation jobs based on cron expressions.
 *
 * Dependencies:
 * - node-cron: npm install node-cron @types/node-cron
 *
 * Enterprise-ready with:
 * - Type-safe Prisma queries
 * - Comprehensive error handling
 * - Idempotent execution
 * - Timezone support
 * - Retry logic
 * - Health monitoring
 * - Graceful shutdown
 */
import { PrismaClient } from '@prisma/client';
interface ScheduledJob {
    id: string;
    name: string;
    scheduleCron: string;
    scheduleTimezone: string;
    tenantId: string;
    lastExecutionAt: Date | null;
    nextExecutionAt: Date | null;
}
export declare class JobSchedulerService {
    private prisma;
    private reconEngine;
    private cronJobs;
    private isRunning;
    private healthCheckInterval;
    private reloadInterval;
    constructor(prisma: PrismaClient);
    /**
     * Start the scheduler
     */
    start(): Promise<void>;
    /**
     * Stop the scheduler
     */
    stop(): Promise<void>;
    /**
     * Load all scheduled jobs from database and schedule them
     */
    private loadAndScheduleJobs;
    /**
     * Reload jobs (pick up new/changed/deleted jobs)
     */
    private reloadJobs;
    /**
     * Schedule a single job
     */
    scheduleJob(job: ScheduledJob): Promise<void>;
    /**
     * Unschedule a job
     */
    unscheduleJob(jobId: string): Promise<void>;
    /**
     * Execute a scheduled job
     */
    private executeJob;
    /**
     * Health check - verify scheduler is running correctly
     */
    private healthCheck;
    /**
     * Get scheduler status
     */
    getStatus(): {
        isRunning: boolean;
        activeJobCount: number;
        jobIds: string[];
        hasCronLibrary: boolean;
    };
}
/**
 * Get or create scheduler instance
 */
export declare function getJobSchedulerService(prisma: PrismaClient): JobSchedulerService;
export {};
//# sourceMappingURL=scheduler-service.d.ts.map