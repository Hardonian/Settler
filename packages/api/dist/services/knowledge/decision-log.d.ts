/**
 * Decision Log System
 *
 * Captures every significant decision with context, rationale, and outcomes.
 * Ensures institutional knowledge persists as the team grows.
 */
import { EventEmitter } from 'events';
export interface Decision {
    id: string;
    title: string;
    date: Date;
    decisionMakers: string[];
    status: 'proposed' | 'accepted' | 'rejected' | 'superseded';
    context: string;
    decision: string;
    rationale: string;
    alternativesConsidered: Array<{
        option: string;
        whyNot: string;
    }>;
    expectedOutcomes: string;
    actualOutcomes: Array<{
        date: Date;
        outcome: string;
    }>;
    lessonsLearned: string;
    relatedDecisions: string[];
    tags: string[];
}
export declare class DecisionLog extends EventEmitter {
    private decisions;
    private logDirectory;
    constructor(logDirectory?: string);
    /**
     * Create a new decision
     */
    createDecision(decision: Omit<Decision, 'id' | 'date'>): Promise<Decision>;
    /**
     * Update decision outcomes
     */
    updateOutcomes(decisionId: string, outcome: string): Promise<Decision>;
    /**
     * Update decision status
     */
    updateStatus(decisionId: string, status: Decision['status']): Promise<Decision>;
    /**
     * Get a decision by ID
     */
    getDecision(decisionId: string): Decision | undefined;
    /**
     * Query decisions
     */
    queryDecisions(query: {
        status?: Decision['status'];
        decisionMaker?: string;
        tag?: string;
        dateRange?: {
            start: Date;
            end: Date;
        };
        search?: string;
    }): Decision[];
    /**
     * Get related decisions
     */
    getRelatedDecisions(decisionId: string): Decision[];
    /**
     * Save decision to file
     */
    private saveDecision;
    /**
     * Convert decision to markdown
     */
    private decisionToMarkdown;
    /**
     * Ensure directory exists
     */
    private ensureDirectoryExists;
    /**
     * Load decisions from directory
     */
    loadDecisions(): Promise<void>;
}
export declare const decisionLog: DecisionLog;
//# sourceMappingURL=decision-log.d.ts.map