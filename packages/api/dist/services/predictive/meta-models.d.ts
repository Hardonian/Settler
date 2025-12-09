/**
 * Meta-Models
 *
 * Internal models that evaluate jobs and recommend optimizations
 * Part 9: Predictive Ops, Meta-Models & Next-Gen Pipelines
 */
import { AIModel } from '../ai-mesh/ai-router';
export interface JobComplexity {
    level: 'low' | 'medium' | 'high' | 'very_high';
    factors: string[];
    estimatedTokens: number;
    estimatedCost: number;
    estimatedTime: number;
}
export interface ModelRecommendation {
    recommendedModel: AIModel;
    alternatives: AIModel[];
    reasoning: string;
    estimatedCost: number;
    estimatedLatency: number;
    confidence: number;
}
export interface ModelBenchmark {
    model: AIModel;
    accuracy: number;
    latency: number;
    cost: number;
    reliability: number;
}
export interface ReconJobInput {
    id?: string;
    name?: string;
    sourceAdapter?: string;
    targetAdapter?: string;
    validationRules?: unknown[];
    metadata?: Record<string, unknown>;
    [key: string]: unknown;
}
export declare class MetaModels {
    private router;
    constructor();
    /**
     * Evaluate job complexity
     */
    evaluateJobComplexity(job: ReconJobInput): JobComplexity;
    /**
     * Estimate LLM cost
     */
    estimateLLMCost(model: AIModel, tokens: number): number;
    /**
     * Recommend best model
     */
    recommendModel(_job: ReconJobInput, complexity: JobComplexity, accuracyRequired: number, budget?: number): ModelRecommendation;
    /**
     * Select optimal model
     */
    private selectOptimalModel;
    /**
     * Predict execution time
     */
    predictExecutionTime(complexity: JobComplexity, model: AIModel): number;
    /**
     * Benchmark models
     */
    benchmarkModels(job: ReconJobInput): Promise<ModelBenchmark[]>;
}
//# sourceMappingURL=meta-models.d.ts.map