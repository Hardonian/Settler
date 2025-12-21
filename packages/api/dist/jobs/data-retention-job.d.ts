/**
 * Data Retention Job
 *
 * Scheduled job to enforce data retention policies.
 * Runs daily to delete data older than retention period.
 */
/**
 * Run data retention enforcement job
 * Should be scheduled to run daily (e.g., via cron or scheduled function)
 */
export declare function runDataRetentionJob(): Promise<void>;
export default runDataRetentionJob;
//# sourceMappingURL=data-retention-job.d.ts.map