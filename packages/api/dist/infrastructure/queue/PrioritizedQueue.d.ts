/**
 * Prioritized Queue System
 * Queue with priority levels and enterprise bypass
 */
import { Job } from 'bullmq';
import { TenantTier } from '../../domain/entities/Tenant';
export declare enum QueuePriority {
    LOW = 1,
    NORMAL = 5,
    HIGH = 10,
    CRITICAL = 20
}
export interface QueueJobData {
    tenantId: string;
    tenantTier: TenantTier;
    jobId?: string;
    [key: string]: any;
}
export declare class PrioritizedQueue {
    private queueName;
    private processor;
    private queue;
    private worker;
    private redis;
    constructor(queueName: string, processor: (job: Job<QueueJobData>) => Promise<any>);
    /**
     * Add job to queue with priority
     * Enterprise tenants bypass queue and execute immediately
     */
    add(data: QueueJobData, priority?: QueuePriority, options?: {
        delay?: number;
    }): Promise<Job<QueueJobData>>;
    /**
     * Calculate priority score based on tier and priority
     */
    private calculatePriority;
    /**
     * Start worker to process jobs
     */
    startWorker(concurrency?: number): void;
    /**
     * Get queue statistics
     */
    getStats(): Promise<{
        waiting: number;
        active: number;
        completed: number;
        failed: number;
        delayed: number;
    }>;
    /**
     * Pause queue processing
     */
    pause(): Promise<void>;
    /**
     * Resume queue processing
     */
    resume(): Promise<void>;
    /**
     * Close queue and worker
     */
    close(): Promise<void>;
}
//# sourceMappingURL=PrioritizedQueue.d.ts.map