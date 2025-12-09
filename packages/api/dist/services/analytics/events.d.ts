/**
 * Analytics Event Tracking Service
 * Tracks user events for growth analytics
 */
export interface AnalyticsEvent {
    userId: string;
    event: string;
    properties?: Record<string, unknown>;
    timestamp?: Date;
}
/**
 * Track an analytics event
 */
export declare function trackEvent(userId: string, event: string, properties?: Record<string, unknown>): Promise<void>;
/**
 * Track activation event
 */
export declare function trackActivationEvent(userId: string, step: string, additionalProperties?: Record<string, unknown>): Promise<void>;
/**
 * Track conversion event
 */
export declare function trackConversionEvent(userId: string, event: string, properties?: Record<string, unknown>): Promise<void>;
/**
 * Track usage event
 */
export declare function trackUsageEvent(userId: string, metricType: string, value: number, additionalProperties?: Record<string, unknown>): Promise<void>;
/**
 * Track feature access event
 */
export declare function trackFeatureAccess(userId: string, feature: string, accessed: boolean, planType?: string): Promise<void>;
/**
 * Batch track events (for performance)
 */
export declare function trackEvents(events: AnalyticsEvent[]): Promise<void>;
//# sourceMappingURL=events.d.ts.map