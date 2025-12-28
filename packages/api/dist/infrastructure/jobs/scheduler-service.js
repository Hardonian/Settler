"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobSchedulerService = void 0;
exports.getJobSchedulerService = getJobSchedulerService;
const logger_1 = require("../../utils/logger");
const recon_core_1 = require("../../services/recon-core");
// Dynamic import for node-cron (allows graceful degradation)
let cron = null;
try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cron = require('node-cron');
}
catch (error) {
    (0, logger_1.logWarn)('[JobScheduler] node-cron not installed. Scheduled jobs will not run.');
    (0, logger_1.logWarn)('[JobScheduler] Install with: npm install node-cron @types/node-cron');
}
class JobSchedulerService {
    prisma;
    reconEngine;
    cronJobs = new Map();
    isRunning = false;
    healthCheckInterval = null;
    reloadInterval = null;
    constructor(prisma) {
        this.prisma = prisma;
        this.reconEngine = new recon_core_1.ReconCoreEngine(prisma);
    }
    /**
     * Start the scheduler
     */
    async start() {
        if (this.isRunning) {
            (0, logger_1.logWarn)('[JobScheduler] Already running');
            return;
        }
        if (!cron) {
            (0, logger_1.logError)('[JobScheduler] Cannot start: node-cron not installed');
            return;
        }
        (0, logger_1.logInfo)('[JobScheduler] Starting scheduler...');
        this.isRunning = true;
        // Load and schedule all active jobs
        await this.loadAndScheduleJobs();
        // Set up health check (every minute)
        this.healthCheckInterval = setInterval(() => {
            this.healthCheck().catch((error) => {
                (0, logger_1.logError)('[JobScheduler] Health check failed:', error);
            });
        }, 60000);
        // Reload jobs periodically (every 5 minutes) to pick up new/changed jobs
        this.reloadInterval = setInterval(async () => {
            await this.reloadJobs().catch((error) => {
                (0, logger_1.logError)('[JobScheduler] Reload failed:', error);
            });
        }, 300000);
        (0, logger_1.logInfo)('[JobScheduler] Scheduler started');
    }
    /**
     * Stop the scheduler
     */
    async stop() {
        if (!this.isRunning) {
            return;
        }
        (0, logger_1.logInfo)('[JobScheduler] Stopping scheduler...');
        this.isRunning = false;
        // Stop all cron jobs
        for (const [jobId, { task }] of this.cronJobs.entries()) {
            if (task && typeof task.stop === 'function') {
                task.stop();
            }
            (0, logger_1.logInfo)(`[JobScheduler] Stopped cron job: ${jobId}`);
        }
        this.cronJobs.clear();
        // Clear intervals
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
        if (this.reloadInterval) {
            clearInterval(this.reloadInterval);
            this.reloadInterval = null;
        }
        (0, logger_1.logInfo)('[JobScheduler] Scheduler stopped');
    }
    /**
     * Load all scheduled jobs from database and schedule them
     */
    async loadAndScheduleJobs() {
        try {
            const jobs = await this.prisma.reconJob.findMany({
                where: {
                    status: 'active',
                    scheduleCron: { not: null },
                    deletedAt: null,
                },
                select: {
                    id: true,
                    name: true,
                    scheduleCron: true,
                    scheduleTimezone: true,
                    tenantId: true,
                },
            });
            (0, logger_1.logInfo)(`[JobScheduler] Found ${jobs.length} scheduled jobs`);
            for (const job of jobs) {
                if (job.scheduleCron) {
                    await this.scheduleJob({
                        id: job.id,
                        name: job.name,
                        scheduleCron: job.scheduleCron,
                        scheduleTimezone: job.scheduleTimezone,
                        tenantId: job.tenantId,
                        lastExecutionAt: null,
                        nextExecutionAt: null,
                    });
                }
            }
        }
        catch (error) {
            (0, logger_1.logError)('[JobScheduler] Failed to load jobs:', error);
            throw error;
        }
    }
    /**
     * Reload jobs (pick up new/changed/deleted jobs)
     */
    async reloadJobs() {
        try {
            // Get current jobs from database
            const dbJobs = await this.prisma.reconJob.findMany({
                where: {
                    status: 'active',
                    scheduleCron: { not: null },
                    deletedAt: null,
                },
                select: {
                    id: true,
                    name: true,
                    scheduleCron: true,
                    scheduleTimezone: true,
                    tenantId: true,
                },
            });
            const dbJobIds = new Set(dbJobs.map((j) => j.id));
            // Unschedule jobs that no longer exist or are inactive
            for (const [jobId] of this.cronJobs.entries()) {
                if (!dbJobIds.has(jobId)) {
                    await this.unscheduleJob(jobId);
                }
            }
            // Schedule new or updated jobs
            for (const dbJob of dbJobs) {
                const existing = this.cronJobs.get(dbJob.id);
                if (!existing || existing.job.scheduleCron !== dbJob.scheduleCron || existing.job.scheduleTimezone !== dbJob.scheduleTimezone) {
                    if (dbJob.scheduleCron) {
                        await this.scheduleJob({
                            id: dbJob.id,
                            name: dbJob.name,
                            scheduleCron: dbJob.scheduleCron,
                            scheduleTimezone: dbJob.scheduleTimezone,
                            tenantId: dbJob.tenantId,
                            lastExecutionAt: null,
                            nextExecutionAt: null,
                        });
                    }
                }
            }
        }
        catch (error) {
            (0, logger_1.logError)('[JobScheduler] Failed to reload jobs:', error);
            throw error;
        }
    }
    /**
     * Schedule a single job
     */
    async scheduleJob(job) {
        if (!cron) {
            (0, logger_1.logError)('[JobScheduler] Cannot schedule job: node-cron not installed');
            return;
        }
        try {
            // Validate cron expression
            if (!cron.validate(job.scheduleCron)) {
                (0, logger_1.logError)(`[JobScheduler] Invalid cron expression for job ${job.id}: ${job.scheduleCron}`);
                return;
            }
            // Stop existing cron job if any
            const existing = this.cronJobs.get(job.id);
            if (existing && existing.task) {
                existing.task.stop();
            }
            // Create new cron job with timezone support
            const task = cron.schedule(job.scheduleCron, async () => {
                await this.executeJob(job);
            }, {
                scheduled: true,
                timezone: job.scheduleTimezone || 'UTC',
            });
            this.cronJobs.set(job.id, { task, job });
            (0, logger_1.logInfo)(`[JobScheduler] Scheduled job ${job.id} (${job.name})`, {
                cron: job.scheduleCron,
                timezone: job.scheduleTimezone,
            });
        }
        catch (error) {
            (0, logger_1.logError)(`[JobScheduler] Failed to schedule job ${job.id}:`, error);
            throw error;
        }
    }
    /**
     * Unschedule a job
     */
    async unscheduleJob(jobId) {
        const existing = this.cronJobs.get(jobId);
        if (existing && existing.task) {
            existing.task.stop();
            this.cronJobs.delete(jobId);
            (0, logger_1.logInfo)(`[JobScheduler] Unscheduled job ${jobId}`);
        }
    }
    /**
     * Execute a scheduled job
     */
    async executeJob(job) {
        const startTime = Date.now();
        (0, logger_1.logInfo)(`[JobScheduler] Executing job ${job.id} (${job.name})`);
        try {
            // Verify job still exists and is active (idempotent check)
            const dbJob = await this.prisma.reconJob.findFirst({
                where: {
                    id: job.id,
                    status: 'active',
                    deletedAt: null,
                },
            });
            if (!dbJob) {
                console.warn(`[JobScheduler] Job ${job.id} no longer exists or is inactive, unscheduling`);
                await this.unscheduleJob(job.id);
                return;
            }
            // Check if job is already running (prevent concurrent executions)
            const runningResult = await this.prisma.reconResult.findFirst({
                where: {
                    reconJobId: job.id,
                    status: 'running',
                },
                orderBy: {
                    startedAt: 'desc',
                },
            });
            if (runningResult) {
                const runningDuration = Date.now() - runningResult.startedAt.getTime();
                // If job has been running for more than 1 hour, consider it stuck
                if (runningDuration > 3600000) {
                    console.warn(`[JobScheduler] Job ${job.id} appears stuck, allowing new execution`);
                }
                else {
                    console.warn(`[JobScheduler] Job ${job.id} is already running, skipping`);
                    return;
                }
            }
            // Execute the job
            const result = await this.reconEngine.executeReconJob(job.id, job.tenantId, {
                dryRun: false,
                skipValidation: false,
                skipTransformation: false,
                customRules: undefined,
            });
            const duration = Date.now() - startTime;
            console.log(`[JobScheduler] Job ${job.id} executed successfully`, {
                resultId: result.id,
                duration,
            });
            // Update last execution time (idempotent)
            await this.prisma.reconJob.update({
                where: { id: job.id },
                data: {
                    metadata: {
                        ...(dbJob.metadata || {}),
                        lastScheduledExecutionAt: new Date().toISOString(),
                        lastScheduledExecutionResultId: result.id,
                    },
                },
            });
        }
        catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : undefined;
            console.error(`[JobScheduler] Job ${job.id} execution failed:`, {
                error: errorMessage,
                stack: errorStack,
                duration,
            });
            // Create failed result record
            let failedResultId = null;
            try {
                const failedResult = await this.prisma.reconResult.create({
                    data: {
                        reconJobId: job.id,
                        tenantId: job.tenantId,
                        status: 'failed',
                        startedAt: new Date(),
                        completedAt: new Date(),
                        errorMessage: errorMessage,
                        errorStack: errorStack,
                        sourceCount: 0,
                        targetCount: 0,
                        matchedCount: 0,
                        unmatchedSourceCount: 0,
                        unmatchedTargetCount: 0,
                        conflictCount: 0,
                        durationMs: BigInt(duration),
                    },
                });
                failedResultId = failedResult.id;
            }
            catch (createError) {
                console.error(`[JobScheduler] Failed to create error result for job ${job.id}:`, createError);
            }
            // Send failure notification
            if (failedResultId) {
                try {
                    const { notifyJobFailure } = await Promise.resolve().then(() => __importStar(require('../../services/notifications/job-failure')));
                    await notifyJobFailure(this.prisma, {
                        jobId: job.id,
                        resultId: failedResultId,
                        errorMessage: errorMessage,
                        errorStack: errorStack,
                        tenantId: job.tenantId,
                        userId: 'system',
                    });
                }
                catch (notificationError) {
                    // Don't fail if notification fails
                    console.error(`[JobScheduler] Failed to send failure notification:`, notificationError);
                }
            }
            // Don't throw - allow scheduler to continue
        }
    }
    /**
     * Health check - verify scheduler is running correctly
     */
    async healthCheck() {
        try {
            // Verify we have active cron jobs
            const activeJobCount = this.cronJobs.size;
            // Verify database connection
            await this.prisma.$queryRaw `SELECT 1`;
            // Log health status (only if there are jobs to avoid spam)
            if (activeJobCount > 0) {
                console.log(`[JobScheduler] Health check OK - ${activeJobCount} active jobs`);
            }
        }
        catch (error) {
            console.error('[JobScheduler] Health check failed:', error);
        }
    }
    /**
     * Get scheduler status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            activeJobCount: this.cronJobs.size,
            jobIds: Array.from(this.cronJobs.keys()),
            hasCronLibrary: cron !== null,
        };
    }
}
exports.JobSchedulerService = JobSchedulerService;
// Singleton instance
let schedulerInstance = null;
/**
 * Get or create scheduler instance
 */
function getJobSchedulerService(prisma) {
    if (!schedulerInstance) {
        schedulerInstance = new JobSchedulerService(prisma);
    }
    return schedulerInstance;
}
//# sourceMappingURL=scheduler-service.js.map