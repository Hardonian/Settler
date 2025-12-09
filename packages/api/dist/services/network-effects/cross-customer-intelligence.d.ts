/**
 * Cross-Customer Intelligence System
 *
 * Aggregates anonymized reconciliation patterns across all customers to detect
 * fraud and anomalies. One customer's anomaly detection improves detection for all.
 */
import { EventEmitter } from 'events';
export interface AnonymizedPattern {
    id: string;
    patternHash: string;
    patternType: 'fraud' | 'anomaly' | 'performance' | 'error';
    frequency: number;
    firstSeen: Date;
    lastSeen: Date;
    metadata: Record<string, unknown>;
}
export interface PatternMatch {
    patternId: string;
    confidence: number;
    matchReason: string;
    recommendedAction: string;
}
export declare class CrossCustomerIntelligence extends EventEmitter {
    private patterns;
    private customerPatterns;
    private optInCustomers;
    /**
     * Opt-in a customer to share anonymized patterns
     */
    optIn(customerId: string): void;
    /**
     * Opt-out a customer
     */
    optOut(customerId: string): void;
    /**
     * Submit a pattern from a customer (anonymized)
     */
    submitPattern(customerId: string, pattern: {
        type: AnonymizedPattern['patternType'];
        data: Record<string, unknown>;
    }): string;
    /**
     * Check if a pattern matches known patterns
     */
    checkPattern(pattern: {
        type: AnonymizedPattern['patternType'];
        data: Record<string, unknown>;
    }): PatternMatch | null;
    /**
     * Get network insights (anonymized)
     */
    getNetworkInsights(): {
        totalPatterns: number;
        fraudPatterns: number;
        anomalyPatterns: number;
        topPatterns: Array<{
            id: string;
            type: string;
            frequency: number;
        }>;
    };
    /**
     * Hash pattern for anonymization (differential privacy)
     */
    private hashPattern;
    /**
     * Anonymize metadata (remove PII, add noise for differential privacy)
     */
    private anonymizeMetadata;
    /**
     * Get recommended action based on pattern
     */
    private getRecommendedAction;
}
export declare const crossCustomerIntelligence: CrossCustomerIntelligence;
//# sourceMappingURL=cross-customer-intelligence.d.ts.map