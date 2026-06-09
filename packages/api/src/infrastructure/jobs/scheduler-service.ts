/**
 * Job Scheduler Service - Postgres SKIP LOCKED implementation
 *
 * Executes scheduled reconciliation jobs using Postgres FOR UPDATE SKIP LOCKED
 * for robust, horizontally scalable queue processing without split-brain issues.
 *
 * Replaces node-cron which caused duplicate executions in multi-pod environments.
 */

import { PrismaClient } from "@prisma/client";
import * as cronParser from "cron-parser";
import { logInfo, logError, logWarn } from "../../utils/logger";
import { ReconCoreEngine } from "../../services/recon-core";
import { v4 as uuidv4 } from "uuid";

export class JobSchedulerService {
  private prisma: PrismaClient;
  private reconEngine: ReconCoreEngine;
  private isRunning = false;
  private enqueuerInterval: NodeJS.Timeout | null = null;
  private workerInterval: NodeJS.Timeout | null = null;

  private static instance: JobSchedulerService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.reconEngine = new ReconCoreEngine(prisma);
  }

  public getStatus() {
    return {
      running: this.isRunning,
      enqueuerActive: this.enqueuerInterval !== null,
      workerActive: this.workerInterval !== null,
    };
  }

  /**
   * Start the scheduler
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logWarn("[JobScheduler] Already running");
      return;
    }

    logInfo("[JobScheduler] Starting SKIP LOCKED scheduler...");
    this.isRunning = true;

    // The enqueuer checks ReconJob schedules and queues them into ScheduledJob
    // Run every minute
    this.enqueuerInterval = setInterval(() => {
      this.enqueueJobs().catch((err) => {
        logError("[JobScheduler] Enqueuer failed:", err);
      });
    }, 60000);

    // Initial enqueue run immediately
    this.enqueueJobs().catch((err) => logError("[JobScheduler] Initial enqueue failed:", err));

    // The worker polls ScheduledJob using SKIP LOCKED
    // Run every 10 seconds
    this.workerInterval = setInterval(() => {
      this.pollAndExecute().catch((err) => {
        logError("[JobScheduler] Worker poll failed:", err);
      });
    }, 10000);

    logInfo("[JobScheduler] Scheduler started");
  }

  /**
   * Stop the scheduler
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    logInfo("[JobScheduler] Stopping scheduler...");
    this.isRunning = false;

    if (this.enqueuerInterval) {
      clearInterval(this.enqueuerInterval);
      this.enqueuerInterval = null;
    }

    if (this.workerInterval) {
      clearInterval(this.workerInterval);
      this.workerInterval = null;
    }

    logInfo("[JobScheduler] Scheduler stopped");
  }

  /**
   * Enqueues jobs that are due for execution based on their cron schedules.
   */
  private async enqueueJobs(): Promise<void> {
    try {
      // Find all active cron jobs
      const jobs = await this.prisma.reconJob.findMany({
        where: {
          status: "active",
          scheduleCron: { not: null },
          deletedAt: null,
        },
      });

      const now = new Date();

      for (const job of jobs) {
        if (!job.scheduleCron) continue;

        try {
          const interval = (cronParser as any).parseExpression(job.scheduleCron, {
            tz: job.scheduleTimezone || "UTC",
          });

          const nextDate = interval.next().toDate();
          const prevDate = interval.prev().toDate();

          // We check if the previous expected execution was in the past minute
          // Or if we haven't scheduled it yet.
          // Better logic: calculate nextExecutionAt if not set, or check if now > nextExecutionAt

          let shouldQueue = false;
          let newNextExecution: Date | null = null;

          if (!job.nextExecutionAt) {
            // First time seeing this job, calculate next execution and update
            newNextExecution = interval.next().toDate();
            // Actually, we might want to trigger immediately if we just created it? No, wait for next.
          } else if (job.nextExecutionAt <= now) {
            shouldQueue = true;
            // Calculate next execution after current time
            newNextExecution = interval.next().toDate();
            // If interval.next() is still in the past, loop until it's future
            while (newNextExecution <= now) {
              newNextExecution = interval.next().toDate();
            }
          }

          if (shouldQueue) {
            // We need to enqueue this job!
            // First check if there's already a pending ScheduledJob to prevent duplicates if enqueuer runs twice
            const existing = await this.prisma.scheduledJob.findFirst({
              where: {
                reconJobId: job.id,
                status: "pending",
              },
            });

            if (!existing) {
              await this.prisma.scheduledJob.create({
                data: {
                  reconJobId: job.id,
                  tenantId: job.tenantId,
                  status: "pending",
                  scheduledFor: job.nextExecutionAt || now,
                },
              });
              logInfo(`[JobScheduler] Enqueued job ${job.id}`, {
                scheduledFor: job.nextExecutionAt,
              });
            }
          }

          // Update nextExecutionAt if needed
          if (newNextExecution) {
            await this.prisma.reconJob.update({
              where: { id: job.id },
              data: { nextExecutionAt: newNextExecution },
            });
          }
        } catch (err) {
          logWarn(`[JobScheduler] Invalid cron for job ${job.id}: ${job.scheduleCron}`);
        }
      }
    } catch (error) {
      logError("[JobScheduler] Enqueue error:", error);
    }
  }

  /**
   * Polls the scheduled_jobs table using SKIP LOCKED and executes one if found.
   */
  private async pollAndExecute(): Promise<void> {
    if (!this.isRunning) return;

    try {
      // Use raw SQL for SKIP LOCKED since Prisma doesn't natively support it yet
      const lockedJobs: any[] = await this.prisma.$queryRaw`
        UPDATE scheduled_jobs
        SET status = 'running', locked_at = NOW()
        WHERE id = (
          SELECT id
          FROM scheduled_jobs
          WHERE status = 'pending' AND scheduled_for <= NOW()
          ORDER BY scheduled_for ASC
          FOR UPDATE SKIP LOCKED
          LIMIT 1
        )
        RETURNING *;
      `;

      if (!lockedJobs || lockedJobs.length === 0) {
        return; // No jobs to process
      }

      const lockedJob = lockedJobs[0];
      logInfo(
        `[JobScheduler] Acquired lock for scheduled job ${lockedJob.id} (reconJobId: ${lockedJob.recon_job_id})`
      );

      // Start execution
      await this.prisma.scheduledJob.update({
        where: { id: lockedJob.id },
        data: { startedAt: new Date() },
      });

      const startTime = Date.now();

      try {
        const result = await this.reconEngine.executeReconJob(
          lockedJob.recon_job_id,
          lockedJob.tenant_id,
          {
            dryRun: false,
            skipValidation: false,
            skipTransformation: false,
          }
        );

        const duration = Date.now() - startTime;

        await this.prisma.scheduledJob.update({
          where: { id: lockedJob.id },
          data: {
            status: "completed",
            completedAt: new Date(),
          },
        });

        // Update ReconJob metadata to reflect last scheduled execution
        await this.prisma.reconJob.update({
          where: { id: lockedJob.recon_job_id },
          data: {
            metadata: {
              lastScheduledExecutionAt: new Date().toISOString(),
              lastScheduledExecutionResultId: result.id,
            },
          },
        });

        logInfo(
          `[JobScheduler] Scheduled job ${lockedJob.id} completed successfully in ${duration}ms`
        );
      } catch (execError) {
        const duration = Date.now() - startTime;
        const errorMessage = execError instanceof Error ? execError.message : String(execError);

        await this.prisma.scheduledJob.update({
          where: { id: lockedJob.id },
          data: {
            status: "failed",
            completedAt: new Date(),
            error: errorMessage,
          },
        });

        logError(`[JobScheduler] Scheduled job ${lockedJob.id} failed`, execError, { duration });
      }

      // If we got a job, there might be more. Immediately poll again.
      // Doing this async so we don't block.
      setImmediate(() => this.pollAndExecute());
    } catch (error) {
      logError("[JobScheduler] Poll error:", error);
    }
  }
}

let schedulerInstance: JobSchedulerService | null = null;

export function getJobSchedulerService(prisma: PrismaClient): JobSchedulerService {
  if (!schedulerInstance) {
    schedulerInstance = new JobSchedulerService(prisma);
  }
  return schedulerInstance;
}
