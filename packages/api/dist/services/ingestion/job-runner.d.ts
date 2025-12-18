/**
 * Ingestion Job Runner
 * Serverless-friendly job runner with retry/backoff and idempotency
 */
import { IngestionJobConfig } from "./types";
export interface JobRunnerOptions {
    maxRetries?: number;
    retryDelayMs?: number;
    idempotencyWindowMs?: number;
}
/**
 * Run ingestion job with retry and idempotency
 */
export declare function runIngestionJob<T>(config: IngestionJobConfig, jobFn: (ingestionId: string) => Promise<T>, options?: JobRunnerOptions): Promise<{
    ingestionId: string;
    result: T;
}>;
/**
 * Process ingestion job (serverless-friendly)
 * Can be triggered by API call, webhook, or scheduled job
 */
export declare function processIngestionJob(ingestionId: string): Promise<void>;
//# sourceMappingURL=job-runner.d.ts.map