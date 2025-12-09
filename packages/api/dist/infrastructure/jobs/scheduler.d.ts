/**
 * BullMQ Job Scheduler
 * Replaces setTimeout/setInterval with proper job queue system
 */
import { Queue, Worker, QueueEvents } from "bullmq";
export declare const jobQueue: Queue<any, any, string, any, any, string>;
export declare const queueEvents: QueueEvents;
export declare const jobWorker: Worker<any, any, string>;
/**
 * Initialize scheduled jobs
 */
export declare function initializeScheduledJobs(): Promise<void>;
/**
 * Graceful shutdown
 */
export declare function shutdownScheduler(): Promise<void>;
//# sourceMappingURL=scheduler.d.ts.map