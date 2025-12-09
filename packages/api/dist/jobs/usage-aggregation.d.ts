/**
 * Usage Aggregation Job
 *
 * Aggregates usage events into daily aggregates for billing.
 * Runs nightly via CRON or scheduled job.
 */
/**
 * Aggregate usage events for a date range
 */
export declare function aggregateUsageEvents(startDate?: Date, // Yesterday
endDate?: Date): Promise<number>;
/**
 * Sync usage to Stripe for metered billing
 */
export declare function syncUsageToStripe(date?: Date): Promise<void>;
/**
 * Run daily usage aggregation job
 * Should be called by CRON or scheduled job runner
 */
export declare function runDailyUsageAggregation(): Promise<void>;
//# sourceMappingURL=usage-aggregation.d.ts.map