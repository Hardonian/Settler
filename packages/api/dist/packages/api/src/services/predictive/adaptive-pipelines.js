"use strict";
/**
 * Adaptive Pipelines
 *
 * Pipelines that dynamically switch models, engines, and routes
 * Part 9: Predictive Ops, Meta-Models & Next-Gen Pipelines
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdaptivePipelines = void 0;
// logInfo and RoutingDecision imported but unused - may be used in future
const predictive_router_1 = require("../intelligence/predictive-router");
const meta_models_1 = require("./meta-models");
class AdaptivePipelines {
    _router;
    metaModels;
    constructor() {
        this._router = new predictive_router_1.PredictiveRouter();
        // Reserved for future use
        void this._router;
        this.metaModels = new meta_models_1.MetaModels();
    }
    /**
     * Adapt pipeline based on conditions
     */
    async adaptPipeline(pipeline, config) {
        const changes = [];
        // Adapt model selection
        if (pipeline.usesAI) {
            const modelChange = await this.adaptModel(pipeline, config);
            if (modelChange) {
                changes.push(modelChange);
                pipeline.model = modelChange.to;
            }
        }
        // Adapt engine selection
        const engineChange = await this.adaptEngine(pipeline, config);
        if (engineChange) {
            changes.push(engineChange);
            pipeline.engine = engineChange.to;
        }
        // Adapt route selection
        const routeChange = await this.adaptRoute(pipeline, config);
        if (routeChange) {
            changes.push(routeChange);
            pipeline.route = routeChange.to;
        }
        return {
            adaptedPipeline: pipeline,
            changes,
        };
    }
    /**
     * Adapt model selection
     */
    async adaptModel(pipeline, config) {
        const currentModel = pipeline.model || 'gpt-3.5-turbo';
        const complexity = this.metaModels.evaluateJobComplexity(pipeline);
        // Check cost limit
        if (config.costLimit) {
            const currentCost = this.metaModels.estimateLLMCost(currentModel, complexity.estimatedTokens);
            if (currentCost > config.costLimit) {
                // Switch to cheaper model
                const recommendation = this.metaModels.recommendModel(pipeline, complexity, 0.8, // Minimum accuracy
                config.costLimit);
                if (recommendation.recommendedModel !== currentModel) {
                    return {
                        type: 'model_switch',
                        from: currentModel,
                        to: recommendation.recommendedModel,
                        reason: `Cost limit exceeded - switching to cheaper model`,
                    };
                }
            }
        }
        // Check SLA tier
        if (config.slaTier === 'enterprise' && currentModel === 'gpt-3.5-turbo') {
            return {
                type: 'model_switch',
                from: currentModel,
                to: 'gpt-4',
                reason: 'Enterprise SLA requires higher accuracy model',
            };
        }
        // Check observed errors
        if (config.observedErrors && config.observedErrors.length > 3) {
            // Switch to more reliable model
            return {
                type: 'model_switch',
                from: currentModel,
                to: 'gpt-4',
                reason: 'High error rate - switching to more reliable model',
            };
        }
        return null;
    }
    /**
     * Adapt engine selection
     */
    async adaptEngine(pipeline, config) {
        const currentEngine = pipeline.engine || 'ai';
        // Switch to deterministic for low complexity
        if (config.workloadShape === 'cpu_bound' && currentEngine === 'ai') {
            const complexity = this.metaModels.evaluateJobComplexity(pipeline);
            if (complexity.level === 'low') {
                return {
                    type: 'engine_switch',
                    from: currentEngine,
                    to: 'deterministic',
                    reason: 'Low complexity - deterministic engine sufficient',
                };
            }
        }
        // Switch to AI for high complexity
        if (config.workloadShape === 'ai_bound' && currentEngine === 'deterministic') {
            return {
                type: 'engine_switch',
                from: currentEngine,
                to: 'ai',
                reason: 'High complexity requires AI engine',
            };
        }
        return null;
    }
    /**
     * Adapt route selection
     */
    async adaptRoute(pipeline, config) {
        const currentRoute = pipeline.route || 'server';
        // Switch to edge for low latency requirements
        if (config.slaTier === 'enterprise' && currentRoute === 'server') {
            return {
                type: 'route_switch',
                from: currentRoute,
                to: 'edge',
                reason: 'Enterprise SLA requires edge routing for low latency',
            };
        }
        // Switch to server for heavy workloads
        if (config.workloadShape === 'cpu_bound' && currentRoute === 'edge') {
            return {
                type: 'route_switch',
                from: currentRoute,
                to: 'server',
                reason: 'CPU-bound workload requires server execution',
            };
        }
        return null;
    }
}
exports.AdaptivePipelines = AdaptivePipelines;
//# sourceMappingURL=adaptive-pipelines.js.map