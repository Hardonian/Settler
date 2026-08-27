import { Queue, Worker, Job } from "bullmq";
import Redis from "ioredis";
import { config } from "../../config";
import { logInfo, logError } from "../../utils/logger";

export interface AuditLogData {
  tenantId: string;
  action: string;
  actorId: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export class SiemEgressEngine {
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

    this.queue = new Queue("audit_log_egress", {
      connection: this.redis as any,
      defaultJobOptions: {
        attempts: 5, // Retry up to 5 times for SIEM flakiness
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: { age: 86400 }, // Keep completed for 1 day
        removeOnFail: { age: 86400 * 7 }, // Keep failed for 7 days
      },
    });
  }

  async enqueueAuditLog(data: AuditLogData): Promise<void> {
    await this.queue.add("egress-siem", data);
  }

  startWorker(concurrency: number = 5): void {
    if (this.worker) return;

    this.worker = new Worker(
      "audit_log_egress",
      async (job: Job<AuditLogData>) => {
        const payload = job.data;
        const startTime = Date.now();

        try {
          // If SIEM URL is configured in environment, egress the log
          // Normally this would be a config like config.siem.webhookUrl
          const siemUrl = process.env.SIEM_WEBHOOK_URL;
          const siemToken = process.env.SIEM_WEBHOOK_TOKEN;

          if (siemUrl) {
            const response = await fetch(siemUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(siemToken ? { Authorization: `Bearer ${siemToken}` } : {}),
              },
              body: JSON.stringify({
                source: "settler-api",
                event: payload,
              }),
            });

            if (!response.ok) {
              throw new Error(`SIEM endpoint returned ${response.status}`);
            }
          } else {
            // Mock mode for local testing if SIEM URL isn't present
            logInfo(`[SIEM EGRESS MOCK] Audit log sent for tenant: ${payload.tenantId}`, {
              ...payload,
              metadata: payload.metadata || {},
            } as Record<string, unknown>);
          }

          return { success: true, durationMs: Date.now() - startTime };
        } catch (error: any) {
          logError(`Failed to egress audit log to SIEM`, error, {
            jobId: job.id,
            tenantId: payload.tenantId,
          });
          throw error;
        }
      },
      { connection: this.redis as any, concurrency }
    );

    this.worker.on("failed", (job, err) => {
      logError(`SIEM Egress Worker failed on job ${job?.id}`, err);
    });
  }

  async close() {
    if (this.worker) await this.worker.close();
    await this.queue.close();
    await this.redis.quit();
  }
}

export const siemEgress = new SiemEgressEngine();
