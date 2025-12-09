/**
 * Cross-Customer Intelligence - Supabase Integration
 *
 * Persists anonymized patterns to Supabase PostgreSQL
 */
import { AnonymizedPattern, PatternMatch } from './cross-customer-intelligence';
import { EventEmitter } from 'events';
export declare class CrossCustomerIntelligenceSupabase extends EventEmitter {
    /**
     * Submit a pattern from a customer (anonymized)
     */
    submitPattern(customerId: string, pattern: {
        type: AnonymizedPattern['patternType'];
        data: Record<string, unknown>;
    }): Promise<string>;
    /**
     * Check if a pattern matches known patterns
     */
    checkPattern(pattern: {
        type: AnonymizedPattern['patternType'];
        data: Record<string, unknown>;
    }): Promise<PatternMatch | null>;
    /**
     * Get network insights (anonymized)
     */
    getNetworkInsights(): Promise<{
        totalPatterns: number;
        fraudPatterns: number;
        anomalyPatterns: number;
        topPatterns: Array<{
            id: string;
            type: string;
            frequency: number;
        }>;
    }>;
    /**
     * Opt-in a customer
     */
    optIn(customerId: string): Promise<void>;
    /**
     * Opt-out a customer
     */
    optOut(customerId: string): Promise<void>;
    /**
     * Hash pattern for anonymization
     */
    private hashPattern;
    /**
     * Anonymize metadata
     */
    private anonymizeMetadata;
    /**
     * Get recommended action
     */
    private getRecommendedAction;
}
//# sourceMappingURL=cross-customer-intelligence-supabase.d.ts.map