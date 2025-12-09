/**
 * Performance Tuning Pools
 *
 * Aggregates performance data across all customers to improve matching algorithms.
 * Customers benefit from collective tuning.
 */
import { EventEmitter } from 'events';
export interface PerformanceMetric {
    jobId: string;
    customerId: string;
    adapter: string;
    ruleType: string;
    accuracy: number;
    latency: number;
    throughput: number;
    timestamp: Date;
}
export interface PerformanceInsight {
    adapter: string;
    ruleType: string;
    avgAccuracy: number;
    avgLatency: number;
    sampleSize: number;
    recommendation?: string;
}
export declare class PerformanceTuningPools extends EventEmitter {
    private metrics;
    private optInCustomers;
    private maxMetrics;
    /**
     * Opt-in a customer to share performance metrics
     */
    optIn(customerId: string): void;
    /**
     * Opt-out a customer
     */
    optOut(customerId: string): void;
    /**
     * Submit performance metrics
     */
    submitMetrics(customerId: string, metrics: Omit<PerformanceMetric, 'customerId' | 'timestamp'>): void;
    /**
     * Get performance insights for an adapter/rule combination
     */
    getInsights(adapter: string, ruleType?: string): PerformanceInsight[];
    /**
     * Get recommended rules for a use case
     */
    getRecommendedRules(adapter: string, _useCase: string): Array<{
        ruleType: string;
        confidence: number;
        expectedAccuracy: number;
    }>;
    /**
     * Generate recommendation based on performance
     */
    private generateRecommendation;
    /**
     * Get aggregate statistics
     */
    getStats(): {
        totalMetrics: number;
        optInCustomers: number;
        adapters: string[];
        topPerformers: Array<{
            adapter: string;
            ruleType: string;
            avgAccuracy: number;
        }>;
    };
}
export declare const performanceTuningPools: PerformanceTuningPools;
//# sourceMappingURL=performance-pools.d.ts.map