/**
 * Multi-Model Router (MMR)
 *
 * Routing for multiple LLM models with fallback, budget control, latency optimization
 * Part 10: Next-Gen Data Plane & Processing Layers
 */
import { AIModel } from '../ai-mesh/ai-router';
export interface MMRConfig {
    primaryModel: AIModel;
    fallbackModels: AIModel[];
    budgetLimit?: number;
    latencyTarget?: number;
    enableFallback: boolean;
}
export interface MMRDecision {
    selectedModel: AIModel;
    fallbackChain: AIModel[];
    estimatedCost: number;
    estimatedLatency: number;
    reasoning: string;
}
export declare class MultiModelRouter {
    private router;
    private config;
    constructor(config: MMRConfig);
    /**
     * Route request to optimal model
     */
    route(request: Record<string, unknown>, _complexity: 'low' | 'medium' | 'high'): Promise<MMRDecision>;
    /**
     * Execute with fallback
     * Note: This is a placeholder - actual AI execution should be implemented by the caller
     */
    executeWithFallback(request: unknown, decision: MMRDecision): Promise<{
        result: unknown;
        model: AIModel;
        attempts: number;
    }>;
    /**
     * Estimate cost
     */
    private estimateCost;
    /**
     * Estimate latency
     */
    private estimateLatency;
    /**
     * Estimate tokens
     */
    private estimateTokens;
    /**
     * Build fallback chain
     */
    private buildFallbackChain;
    /**
     * Generate reasoning
     */
    private generateReasoning;
}
//# sourceMappingURL=multi-model-router.d.ts.map