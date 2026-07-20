/**
 * Adaptive Pipelines
 *
 * Pipelines that dynamically switch models, engines, and routes
 * Part 9: Predictive Ops, Meta-Models & Next-Gen Pipelines
 */

import { PredictiveRouter } from "../intelligence/predictive-router";
import { MetaModels } from "./meta-models";
import { AIModel } from "../ai-mesh/ai-router";

export interface AdaptivePipelineConfig {
  priority: "low" | "medium" | "high" | "critical";
  costLimit?: number;
  slaTier: "standard" | "premium" | "enterprise";
  workloadShape: "cpu_bound" | "io_bound" | "ai_bound" | "mixed";
  observedErrors?: string[];
}

export interface Pipeline {
  usesAI?: boolean;
  model?: string;
  engine?: string;
  route?: string;
  [key: string]: unknown;
}

export class AdaptivePipelines {
  private _router: PredictiveRouter;
  private metaModels: MetaModels;

  constructor() {
    this._router = new PredictiveRouter();
    // Reserved for future use
    void this._router;
    this.metaModels = new MetaModels();
  }

  /**
   * Adapt pipeline based on conditions
   */
  async adaptPipeline(
    pipeline: Pipeline,
    config: AdaptivePipelineConfig
  ): Promise<{
    adaptedPipeline: Pipeline;
    changes: Array<{
      type: "model_switch" | "engine_switch" | "route_switch";
      from: string;
      to: string;
      reason: string;
    }>;
  }> {
    const changes: Array<{
      type: "model_switch" | "engine_switch" | "route_switch";
      from: string;
      to: string;
      reason: string;
    }> = [];

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
  private async adaptModel(
    pipeline: Pipeline,
    config: AdaptivePipelineConfig
  ): Promise<{
    type: "model_switch";
    from: string;
    to: string;
    reason: string;
  } | null> {
    const currentModel = pipeline.model || "gpt-3.5-turbo";
    const complexity = this.metaModels.evaluateJobComplexity(pipeline);

    // Check cost limit
    if (config.costLimit) {
      const currentCost = this.metaModels.estimateLLMCost(
        currentModel as AIModel,
        complexity.estimatedTokens
      );
      if (currentCost > config.costLimit) {
        // Switch to cheaper model
        const recommendation = this.metaModels.recommendModel(
          pipeline,
          complexity,
          0.8, // Minimum accuracy
          config.costLimit
        );

        if (recommendation.recommendedModel !== currentModel) {
          return {
            type: "model_switch",
            from: currentModel,
            to: recommendation.recommendedModel,
            reason: `Cost limit exceeded - switching to cheaper model`,
          };
        }
      }
    }

    // Check SLA tier
    if (config.slaTier === "enterprise" && currentModel === "gpt-3.5-turbo") {
      return {
        type: "model_switch",
        from: currentModel,
        to: "gpt-4",
        reason: "Enterprise SLA requires higher accuracy model",
      };
    }

    // Check observed errors
    if (config.observedErrors && config.observedErrors.length > 3) {
      // Switch to more reliable model
      return {
        type: "model_switch",
        from: currentModel,
        to: "gpt-4",
        reason: "High error rate - switching to more reliable model",
      };
    }

    return null;
  }

  /**
   * Adapt engine selection
   */
  private async adaptEngine(
    pipeline: Pipeline,
    config: AdaptivePipelineConfig
  ): Promise<{
    type: "engine_switch";
    from: string;
    to: string;
    reason: string;
  } | null> {
    const currentEngine = pipeline.engine || "ai";

    // Switch to deterministic for low complexity
    if (config.workloadShape === "cpu_bound" && currentEngine === "ai") {
      const complexity = this.metaModels.evaluateJobComplexity(pipeline);
      if (complexity.level === "low") {
        return {
          type: "engine_switch",
          from: currentEngine,
          to: "deterministic",
          reason: "Low complexity - deterministic engine sufficient",
        };
      }
    }

    // Switch to AI for high complexity
    if (config.workloadShape === "ai_bound" && currentEngine === "deterministic") {
      return {
        type: "engine_switch",
        from: currentEngine,
        to: "ai",
        reason: "High complexity requires AI engine",
      };
    }

    return null;
  }

  /**
   * Adapt route selection
   */
  private async adaptRoute(
    pipeline: Pipeline,
    config: AdaptivePipelineConfig
  ): Promise<{
    type: "route_switch";
    from: string;
    to: string;
    reason: string;
  } | null> {
    const currentRoute = pipeline.route || "server";

    // Switch to edge for low latency requirements
    if (config.slaTier === "enterprise" && currentRoute === "server") {
      return {
        type: "route_switch",
        from: currentRoute,
        to: "edge",
        reason: "Enterprise SLA requires edge routing for low latency",
      };
    }

    // Switch to server for heavy workloads
    if (config.workloadShape === "cpu_bound" && currentRoute === "edge") {
      return {
        type: "route_switch",
        from: currentRoute,
        to: "server",
        reason: "CPU-bound workload requires server execution",
      };
    }

    return null;
  }
}
