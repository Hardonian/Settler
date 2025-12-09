/**
 * AI Router Service
 *
 * Routes AI requests to optimal models based on cost, accuracy, and job type
 * Part of Phase III: Self-Healing AI Mesh
 */
export type AIModel = 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3-opus' | 'claude-3-sonnet' | 'claude-3-haiku' | 'local-llm';
export interface ModelConfig {
    model: AIModel;
    costPer1kTokens: number;
    accuracy: number;
    latency: number;
    maxTokens: number;
    supportsStreaming: boolean;
}
export interface AIRequest {
    jobType: string;
    complexity: 'low' | 'medium' | 'high';
    accuracyRequired: number;
    budget?: number;
    maxLatency?: number;
}
export declare class AIRouter {
    /**
     * Select optimal model for request
     */
    selectModel(request: AIRequest): AIModel;
    /**
     * Get model config
     */
    getModelConfig(model: AIModel): ModelConfig;
    /**
     * Estimate cost for request
     */
    estimateCost(model: AIModel, estimatedTokens: number): number;
}
//# sourceMappingURL=ai-router.d.ts.map