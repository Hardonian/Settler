/**
 * SLA Monitoring Job
 *
 * Scheduled job to check for SLA violations and alert.
 * Runs every hour to check for tickets that may violate SLA.
 */
/**
 * Run SLA monitoring job
 * Should be scheduled to run every hour (e.g., via cron or scheduled function)
 */
export declare function runSLAMonitoringJob(): Promise<void>;
export default runSLAMonitoringJob;
//# sourceMappingURL=sla-monitoring-job.d.ts.map