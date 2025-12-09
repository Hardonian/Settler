/**
 * Analytics Metrics Service
 * Calculates growth and conversion metrics
 */
export interface ActivationMetrics {
    total: number;
    activated: number;
    rate: number;
}
export interface ConversionMetrics {
    trialStarted: number;
    upgradePrompted: number;
    upgradeClicked: number;
    upgradeCompleted: number;
    conversionRate: number;
}
export interface UsageMetrics {
    userId: string;
    reconciliations: number;
    exports: number;
    webhooks: number;
    period: string;
}
/**
 * Get activation rate for a time period
 */
export declare function getActivationRate(days?: number): Promise<ActivationMetrics>;
/**
 * Get conversion metrics
 */
export declare function getConversionMetrics(days?: number): Promise<ConversionMetrics>;
/**
 * Get user usage metrics
 */
export declare function getUserUsageMetrics(userId: string, period?: "month" | "week" | "day"): Promise<UsageMetrics>;
/**
 * Get daily active users
 */
export declare function getDailyActiveUsers(date?: Date): Promise<number>;
/**
 * Get monthly recurring revenue (MRR)
 */
export declare function getMonthlyRecurringRevenue(): Promise<number>;
//# sourceMappingURL=metrics.d.ts.map