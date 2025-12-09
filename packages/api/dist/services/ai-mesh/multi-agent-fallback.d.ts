/**
 * Multi-Agent Fallback System
 *
 * Handles failures with intelligent fallback to alternative agents
 * Part of Phase III: Self-Healing AI Mesh
 */
import { AIRouter, AIModel } from './ai-router';
export interface AgentTask {
    id: string;
    type: 'ingestion' | 'mapping' | 'validation' | 'transform' | 'drift_detection';
    input: Record<string, unknown>;
    retryCount?: number;
}
export interface AgentResponse {
    success: boolean;
    result?: Record<string, unknown>;
    error?: string;
    model?: AIModel;
    cost?: number;
}
export declare class MultiAgentFallback {
    private router;
    private fallbackChain;
    constructor(router: AIRouter);
    /**
     * Execute task with automatic fallback
     */
    executeWithFallback(task: AgentTask, primaryModel?: AIModel): Promise<AgentResponse>;
    /**
     * Execute task with specific model
     */
    private executeTask;
    /**
     * Handle ingestion failure
     */
    handleIngestionFailure(error: Error, context: Record<string, unknown>): Promise<AgentResponse>;
    /**
     * Handle mapping uncertainty
     */
    handleMappingUncertainty(uncertainFields: string[], data: Record<string, unknown>): Promise<AgentResponse>;
    /**
     * Handle schema deviation
     */
    handleSchemaDeviation(expected: Record<string, unknown>, actual: Record<string, unknown>): Promise<AgentResponse>;
}
//# sourceMappingURL=multi-agent-fallback.d.ts.map