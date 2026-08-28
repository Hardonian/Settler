import { Queue, Worker, Job } from "bullmq";
import { exec } from "child_process";
import { promisify } from "util";
import Redis from "ioredis";
import { config } from "../../config";
import { logInfo, logError } from "../../utils/logger";

const execAsync = promisify(exec);

export interface OrchestrationJobData {
  jobName: string;
  command: string;
  cwd?: string;
  timeoutMs?: number;
}

/**
 * Unified Observable Orchestration Engine
 *
 * Handles cron scripts (e.g., marketing/lead-gen) with:
 * - Automated retry logic
 * - SLA alerting (timeouts and failures)
 * - Centralized observability
 */
export class OrchestrationEngine {
  private queue: Queue;
  private worker: Worker | null = null;
  private redis: Redis;

  constructor() {
    if (config.redis.url) {
      this.redis = new Redis(config.redis.url, { maxRetriesPerRequest: 3 });
    } else {
      this.redis = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        maxRetriesPerRequest: 3,
      });
    }

    this.queue = new Queue("orchestration_queue", {
      connection: this.redis as any,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: { age: 86400 * 7 }, // Keep for 7 days
        removeOnFail: { age: 86400 * 30 }, // Keep failures for 30 days
      },
    });
  }

  /**
   * Schedule a repeating cron job
   */
  async scheduleCron(
    jobName: string,
    cronExpression: string,
    command: string,
    cwd?: string
  ): Promise<void> {
    await (this.queue as any).add(
      jobName,
      { jobName, command, cwd },
      { repeat: { pattern: cronExpression } }
    );
    logInfo(`Scheduled cron job: ${jobName} with pattern ${cronExpression}`);
  }

  /**
   * Start the orchestration worker
   */
  startWorker(concurrency: number = 2): void {
    if (this.worker) return;

    this.worker = new Worker(
      "orchestration_queue",
      async (job: Job<OrchestrationJobData>) => {
        const { jobName, command, cwd, timeoutMs = 300000 } = job.data;
        const startTime = Date.now();
        logInfo(`Starting orchestration job: ${jobName}`, { jobId: job.id });

        try {
          // Execute the script
          const { stdout, stderr } = await execAsync(command, {
            cwd: cwd || process.cwd(),
            timeout: timeoutMs,
          });

          const durationMs = Date.now() - startTime;
          logInfo(`Completed orchestration job: ${jobName}`, {
            jobId: job.id,
            durationMs,
            stdoutSnippet: stdout.substring(0, 500),
          });

          return { success: true, stdout, stderr, durationMs };
        } catch (error: any) {
          const durationMs = Date.now() - startTime;
          logError(`Failed orchestration job: ${jobName}`, error, {
            jobId: job.id,
            durationMs,
            slaBreach: true, // Fire SLA alert
          });

          // Trigger SLA Alert via internal alert system
          this.fireSLAAlert(jobName, error.message, durationMs);

          throw error;
        }
      },
      { connection: this.redis as any, concurrency }
    );

    this.worker.on("failed", (job, err) => {
      logError(`Worker failed on job ${job?.id}`, err);
    });
  }

  private fireSLAAlert(jobName: string, errorMsg: string, durationMs: number) {
    // In production, this would route to PagerDuty/Slack via alert manager
    logError("SLA BREACH ALERT", new Error(errorMsg), {
      type: "orchestration_failure",
      jobName,
      durationMs,
      severity: "high",
    });
  }

  async close() {
    if (this.worker) await this.worker.close();
    await this.queue.close();
    await this.redis.quit();
  }
}

/**
 * Initialize all system cron operations into the orchestration engine
 */
export async function setupCentralizedOrchestration(): Promise<OrchestrationEngine> {
  const engine = new OrchestrationEngine();

  // Start the worker to process them
  engine.startWorker();

  return engine;
}
