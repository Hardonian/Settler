/**
 * Multi-Model Router (MMR)
 *
 * Routing for multiple LLM models with fallback, budget control, latency optimization
 * Part 10: Next-Gen Data Plane & Processing Layers
 */

import { logWarn } from "../../utils/logger";
import { AIRouter, AIModel } from "../ai-mesh/ai-router";

export interface MMRConfig {
  primaryModel: AIModel;
  fallbackModels: AIModel[];
  budgetLimit?: number;
  latencyTarget?: number; // milliseconds
  enableFallback: boolean;
}

export interface MMRDecision {
  selectedModel: AIModel;
  fallbackChain: AIModel[];
  estimatedCost: number;
  estimatedLatency: number;
  reasoning: string;
}

export class MultiModelRouter {
  private router: AIRouter;
  private config: MMRConfig;

  constructor(config: MMRConfig) {
    this.router = new AIRouter();
    this.config = config;
  }

  /**
   * Route request to optimal model
   */
  async route(
    request: Record<string, unknown>,
    _complexity: "low" | "medium" | "high"
  ): Promise<MMRDecision> {
    // Start with primary model
    let selectedModel = this.config.primaryModel;
    let estimatedCost = this.estimateCost(selectedModel, request);
    let estimatedLatency = this.estimateLatency(selectedModel, request);

    // Check budget limit
    if (this.config.budgetLimit && estimatedCost > this.config.budgetLimit) {
      // Try fallback models
      for (const fallbackModel of this.config.fallbackModels) {
        const fallbackCost = this.estimateCost(fallbackModel, request);
        if (fallbackCost <= this.config.budgetLimit) {
          selectedModel = fallbackModel;
          estimatedCost = fallbackCost;
          estimatedLatency = this.estimateLatency(fallbackModel, request);
          break;
        }
      }
    }

    // Check latency target
    if (this.config.latencyTarget && estimatedLatency > this.config.latencyTarget) {
      // Try faster models
      for (const fallbackModel of this.config.fallbackModels) {
        const fallbackLatency = this.estimateLatency(fallbackModel, request);
        if (fallbackLatency <= this.config.latencyTarget) {
          selectedModel = fallbackModel;
          estimatedCost = this.estimateCost(fallbackModel, request);
          estimatedLatency = fallbackLatency;
          break;
        }
      }
    }

    // Build fallback chain
    const fallbackChain = this.buildFallbackChain(selectedModel);

    return {
      selectedModel,
      fallbackChain,
      estimatedCost,
      estimatedLatency,
      reasoning: this.generateReasoning(selectedModel, estimatedCost, estimatedLatency),
    };
  }

  /**
   * Execute with fallback
   * Note: This is a placeholder - actual AI execution should be implemented by the caller
   */
  async executeWithFallback(
    request: unknown,
    decision: MMRDecision
  ): Promise<{
    result: unknown;
    model: AIModel;
    attempts: number;
  }> {
    const models = [decision.selectedModel, ...decision.fallbackChain];
    let lastError: Error | null = null;

    for (let i = 0; i < models.length; i++) {
      const model = models[i];
      try {
        // Implement AI model execution
        // This should call the actual AI service with the selected model
        // For now, we return a placeholder result
        const result = { model: model!, request, executed: true };
        return {
          result,
          model: model!,
          attempts: i + 1,
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        lastError = error instanceof Error ? error : new Error(errorMessage);
        logWarn("Model execution failed, trying fallback", {
          model,
          error: errorMessage,
          attempt: i + 1,
        });
      }
    }

    throw new Error(`All models failed. Last error: ${lastError?.message ?? "Unknown error"}`);
  }

  /**
   * Estimate cost
   */
  private estimateCost(model: AIModel, request: Record<string, unknown>): number {
    const config = this.router.getModelConfig(model);
    const estimatedTokens = this.estimateTokens(request);
    return (estimatedTokens / 1000) * config.costPer1kTokens;
  }

  /**
   * Estimate latency
   */
  private estimateLatency(model: AIModel, _request: Record<string, unknown>): number {
    const config = this.router.getModelConfig(model);
    return config.latency;
  }

  /**
   * Estimate tokens
   */
  private estimateTokens(request: Record<string, unknown>): number {
    // Simple estimation based on request size
    const requestSize = JSON.stringify(request).length;
    return Math.ceil(requestSize / 4); // Rough estimate: 4 chars per token
  }

  /**
   * Build fallback chain
   */
  private buildFallbackChain(primaryModel: AIModel): AIModel[] {
    const chain: AIModel[] = [];

    // Add fallback models in order
    for (const fallback of this.config.fallbackModels) {
      if (fallback !== primaryModel) {
        chain.push(fallback);
      }
    }

    return chain;
  }

  /**
   * Generate reasoning
   */
  private generateReasoning(model: AIModel, cost: number, latency: number): string {
    const reasons: string[] = [];

    if (this.config.budgetLimit && cost <= this.config.budgetLimit) {
      reasons.push(`Within budget ($${cost.toFixed(4)})`);
    }

    if (this.config.latencyTarget && latency <= this.config.latencyTarget) {
      reasons.push(`Meets latency target (${latency}ms)`);
    }

    reasons.push(`Selected ${model} for optimal performance`);

    return reasons.join(". ");
  }
}
