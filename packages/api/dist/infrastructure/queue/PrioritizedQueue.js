"use strict";
/**
 * Prioritized Queue System
 * Queue with priority levels and enterprise bypass
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrioritizedQueue = exports.QueuePriority = void 0;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
const config_1 = require("../../config");
const Tenant_1 = require("../../domain/entities/Tenant");
const tracing_1 = require("../observability/tracing");
const metrics_1 = require("../observability/metrics");
var QueuePriority;
(function (QueuePriority) {
    QueuePriority[QueuePriority["LOW"] = 1] = "LOW";
    QueuePriority[QueuePriority["NORMAL"] = 5] = "NORMAL";
    QueuePriority[QueuePriority["HIGH"] = 10] = "HIGH";
    QueuePriority[QueuePriority["CRITICAL"] = 20] = "CRITICAL";
})(QueuePriority || (exports.QueuePriority = QueuePriority = {}));
class PrioritizedQueue {
    queueName;
    processor;
    queue;
    worker = null;
    redis;
    constructor(queueName, processor) {
        this.queueName = queueName;
        this.processor = processor;
        // Prefer REDIS_URL if provided (Upstash format: rediss://default:password@host:6379)
        if (config_1.config.redis.url) {
            this.redis = new ioredis_1.default(config_1.config.redis.url, {
                maxRetriesPerRequest: 3,
                enableReadyCheck: true,
                lazyConnect: true,
            });
        }
        else {
            // Fallback to individual host/port configuration
            const redisOptions = {
                host: config_1.config.redis.host,
                port: config_1.config.redis.port,
            };
            if (config_1.config.redis.password) {
                redisOptions.password = config_1.config.redis.password;
            }
            if (process.env.REDIS_TLS === 'true') {
                redisOptions.tls = {}; // TLS options object, not boolean
            }
            this.redis = new ioredis_1.default(redisOptions);
        }
        this.queue = new bullmq_1.Queue(queueName, {
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
            metrics_1.queueDepth.set({ queue_name: queueName }, waiting + active + delayed);
        }, 5000);
    }
    /**
     * Add job to queue with priority
     * Enterprise tenants bypass queue and execute immediately
     */
    async add(data, priority = QueuePriority.NORMAL, options = {}) {
        // Enterprise tenants bypass queue
        if (data.tenantTier === Tenant_1.TenantTier.ENTERPRISE) {
            return await (0, tracing_1.traceQueue)(this.queueName, 'execute_immediate', async () => {
                // Execute immediately without queuing
                const job = new bullmq_1.Job(this.queue, 'immediate', data, {
                    jobId: `immediate-${Date.now()}`,
                });
                await this.processor(job);
                return job;
            }, data.tenantId, data.jobId);
        }
        // Calculate priority score (higher = more important)
        const priorityScore = this.calculatePriority(data.tenantTier, priority);
        return await (0, tracing_1.traceQueue)(this.queueName, 'add', async () => {
            return await this.queue.add('job', data, (() => {
                const jobOptions = {
                    priority: priorityScore,
                };
                if (options.delay !== undefined) {
                    jobOptions.delay = options.delay;
                }
                if (data.jobId !== undefined) {
                    jobOptions.jobId = data.jobId;
                }
                return jobOptions;
            })());
        }, data.tenantId, data.jobId);
    }
    /**
     * Calculate priority score based on tier and priority
     */
    calculatePriority(tier, priority) {
        const tierMultipliers = {
            [Tenant_1.TenantTier.FREE]: 1,
            [Tenant_1.TenantTier.STARTER]: 2,
            [Tenant_1.TenantTier.GROWTH]: 5,
            [Tenant_1.TenantTier.SCALE]: 10,
            [Tenant_1.TenantTier.ENTERPRISE]: 100, // Shouldn't reach here, but just in case
        };
        return priority * tierMultipliers[tier];
    }
    /**
     * Start worker to process jobs
     */
    startWorker(concurrency = 5) {
        if (this.worker) {
            return; // Already started
        }
        this.worker = new bullmq_1.Worker(this.queueName, async (job) => {
            return await (0, tracing_1.traceQueue)(this.queueName, 'process', async () => {
                return await this.processor(job);
            }, job.data.tenantId, job.data.jobId);
        }, {
            connection: this.redis,
            concurrency,
            limiter: {
                max: 100,
                duration: 1000, // Max 100 jobs per second
            },
        });
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
    async getStats() {
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
    async pause() {
        await this.queue.pause();
    }
    /**
     * Resume queue processing
     */
    async resume() {
        await this.queue.resume();
    }
    /**
     * Close queue and worker
     */
    async close() {
        if (this.worker) {
            await this.worker.close();
        }
        await this.queue.close();
        await this.redis.quit();
    }
}
exports.PrioritizedQueue = PrioritizedQueue;
//# sourceMappingURL=PrioritizedQueue.js.map