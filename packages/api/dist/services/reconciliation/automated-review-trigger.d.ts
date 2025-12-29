/**
 * Automated Review Trigger Service
 *
 * Triggers automated review for reconciliation runs that have completed.
 * Can be called as a scheduled job or webhook handler.
 */
/**
 * Process completed reconciliation runs that haven't been reviewed
 */
export declare function processPendingReviews(limit?: number): Promise<{
    processed: number;
    reviewed: number;
    errors: number;
}>;
/**
 * Trigger automated review for a specific reconciliation run
 * Called automatically after reconciliation completes
 */
export declare function triggerAutomatedReview(runId: string, tenantId: string): Promise<void>;
/**
 * Scheduled job to process pending reviews
 * Should be called periodically (e.g., every 5 minutes)
 */
export declare function scheduledReviewProcessor(): Promise<void>;
//# sourceMappingURL=automated-review-trigger.d.ts.map