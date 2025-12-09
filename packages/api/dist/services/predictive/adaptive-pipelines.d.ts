/**
 * Adaptive Pipelines
 *
 * Pipelines that dynamically switch models, engines, and routes
 * Part 9: Predictive Ops, Meta-Models & Next-Gen Pipelines
 */
export interface AdaptivePipelineConfig {
    priority: 'low' | 'medium' | 'high' | 'critical';
    costLimit?: number;
    slaTier: 'standard' | 'premium' | 'enterprise';
    workloadShape: 'cpu_bound' | 'io_bound' | 'ai_bound' | 'mixed';
    observedErrors?: string[];
}
export interface Pipeline {
    usesAI?: boolean;
    model?: string;
    engine?: string;
    route?: string;
    [key: string]: unknown;
}
export declare class AdaptivePipelines {
    private _router;
    private metaModels;
    constructor();
    /**
     * Adapt pipeline based on conditions
     */
    adaptPipeline(pipeline: Pipeline, config: AdaptivePipelineConfig): Promise<{
        adaptedPipeline: Pipeline;
        changes: Array<{
            type: 'model_switch' | 'engine_switch' | 'route_switch';
            from: string;
            to: string;
            reason: string;
        }>;
    }>;
    /**
     * Adapt model selection
     */
    private adaptModel;
    /**
     * Adapt engine selection
     */
    private adaptEngine;
    /**
     * Adapt route selection
     */
    private adaptRoute;
}
//# sourceMappingURL=adaptive-pipelines.d.ts.map