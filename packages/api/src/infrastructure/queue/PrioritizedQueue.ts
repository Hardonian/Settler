/**
 * Prioritized Queue System
 * Queue with priority levels and enterprise bypass
 */

import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { config } from '../../config';
import { TenantTier } from '../../domain/entities/Tenant';
import { traceQueue } from '../observability/tracing';
import { queueDepth } from '../observability/metrics';

export enum QueuePriority {
  LOW = 1,
  NORMAL = 5,
  HIGH = 10,
  CRITICAL = 20,
}

export interface QueueJobData {
  tenantId: string;
  tenantTier: TenantTier;
  jobId?: string;
  [key: string]: any;
}

export class PrioritizedQueue {
  private queue: Queue;
  private worker: Worker | null = null;
  private redis: Redis;

  constructor(
    private queueName: string,
    private processor: (job: Job<QueueJobData>) => Promise<any>
  ) {
    // Prefer REDIS_URL if provided (Upstash format: rediss://default:password@host:6379)
    if (config.redis.url) {
      this.redis = new Redis(config.redis.url, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true,
      });
    } else {
      // Fallback to individual host/port configuration
      const redisOptions: {
        host: string;
        port: number;
        password?: string;
        tls?: boolean;
      } = {
        host: config.redis.host,
        port: config.redis.port,
      };
      if (config.redis.password) {
        redisOptions.password = config.redis.password;
      }
      if (process.env.REDIS_TLS === 'true') {
        redisOptions.tls = true;
      }
      this.redis = new Redis(redisOptions);
    }

    this.queue = new Queue(queueName, {
      connection: this.redis,
      defaultJobOptions: {
        removeOnComplete: { age: 3600 }, // Keep completed jobs for 1 hour
        removeOnFail: { age: 86400 }, // Keep failed jobs for 24 hours
      },
    });

    // Update queue depth metric
    setInterval(async () => {
      const waiting = await this.queue.getWaitingCount();
      const active = await this.queue.getActiveCount();
      const delayed = await this.queue.getDelayedCount();
      queueDepth.set({ queue_name: queueName }, waiting + active + delayed);
    }, 5000);
  }

  /**
   * Add job to queue with priority
   * Enterprise tenants bypass queue and execute immediately
   */
  async add(
    data: QueueJobData,
    priority: QueuePriority = QueuePriority.NORMAL,
    options: { delay?: number } = {}
  ): Promise<Job<QueueJobData>> {
    // Enterprise tenants bypass queue
    if (data.tenantTier === TenantTier.ENTERPRISE) {
      return await traceQueue(
        this.queueName,
        'execute_immediate',
        async () => {
          // Execute immediately without queuing
          const job = new Job(this.queue, 'immediate', data, {
            jobId: `immediate-${Date.now()}`,
          });
          await this.processor(job);
          return job;
        },
        data.tenantId,
        data.jobId
      );
    }

    // Calculate priority score (higher = more important)
    const priorityScore = this.calculatePriority(data.tenantTier, priority);

    return await traceQueue(
      this.queueName,
      'add',
      async () => {
        return await this.queue.add(
          'job',
          data,
          (() => {
            const jobOptions: { priority: number; delay?: number; jobId?: string } = {
              priority: priorityScore,
            };
            if (options.delay !== undefined) {
              jobOptions.delay = options.delay;
            }
            if (data.jobId !== undefined) {
              jobOptions.jobId = data.jobId;
            }
            return jobOptions;
          })()
        );
      },
      data.tenantId,
      data.jobId
    );
  }

  /**
   * Calculate priority score based on tier and priority
   */
  private calculatePriority(tier: TenantTier, priority: QueuePriority): number {
    const tierMultipliers: Record<TenantTier, number> = {
      [TenantTier.FREE]: 1,
      [TenantTier.STARTER]: 2,
      [TenantTier.GROWTH]: 5,
      [TenantTier.SCALE]: 10,
      [TenantTier.ENTERPRISE]: 100, // Shouldn't reach here, but just in case
    };

    return priority * tierMultipliers[tier];
  }

  /**
   * Start worker to process jobs
   */
  startWorker(concurrency: number = 5): void {
    if (this.worker) {
      return; // Already started
    }

    this.worker = new Worker(
      this.queueName,
      async (job: Job<QueueJobData>) => {
        return await traceQueue(
          this.queueName,
          'process',
          async () => {
            return await this.processor(job);
          },
          job.data.tenantId,
          job.data.jobId
        );
      },
      {
        connection: this.redis,
        concurrency,
        limiter: {
          max: 100,
          duration: 1000, // Max 100 jobs per second
        },
      }
    );

    this.worker.on('completed', (job) => {
      console.log(`Job ${job.id} completed in queue ${this.queueName}`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`Job ${job?.id} failed in queue ${this.queueName}:`, err);
    });
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    return {
      waiting: await this.queue.getWaitingCount(),
      active: await this.queue.getActiveCount(),
      completed: await this.queue.getCompletedCount(),
      failed: await this.queue.getFailedCount(),
      delayed: await this.queue.getDelayedCount(),
    };
  }

  /**
   * Pause queue processing
   */
  async pause(): Promise<void> {
    await this.queue.pause();
  }

  /**
   * Resume queue processing
   */
  async resume(): Promise<void> {
    await this.queue.resume();
  }

  /**
   * Close queue and worker
   */
  async close(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
    }
    await this.queue.close();
    await this.redis.quit();
  }
}
