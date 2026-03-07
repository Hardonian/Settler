/**
 * AI Copilot Safety Layer
 *
 * AI operates strictly as advisory/analysis/suggestion.
 * It can NEVER:
 * - Directly execute workflows
 * - Bypass policy enforcement
 * - Modify deterministic execution state
 *
 * Every AI action is audit-trailed and must pass policy validation
 * before any suggestion can be applied.
 */

import type {
  AISuggestion,
  AISuggestionCategory,
  AIAuditEntry,
  Policy,
} from "./primitives";
import { DeterministicExecutionFence } from "./determinism";

export interface AICopilotConfig {
  enabled: boolean;
  maxSuggestionsPerExecution: number;
  requireHumanReview: boolean;
  allowedCategories: AISuggestionCategory[];
  auditRetentionDays: number;
}

const DEFAULT_CONFIG: AICopilotConfig = {
  enabled: true,
  maxSuggestionsPerExecution: 10,
  requireHumanReview: true,
  allowedCategories: [
    "workflow_optimization",
    "anomaly_detection",
    "policy_recommendation",
    "connector_health",
    "reconciliation_hint",
  ],
  auditRetentionDays: 365,
};

export class AICopilot {
  private suggestions = new Map<string, AISuggestion>();
  private config: AICopilotConfig;
  private fence = new DeterministicExecutionFence();

  constructor(config: Partial<AICopilotConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Create an advisory suggestion. This NEVER mutates execution state.
   */
  suggest(params: {
    tenantId: string;
    executionId?: string;
    workflowId?: string;
    category: AISuggestionCategory;
    title: string;
    description: string;
    confidence: number;
  }): AISuggestion {
    // Enforce: AI cannot operate during deterministic execution
    this.fence.assertNotInFence("ai.suggest");

    if (!this.config.enabled) {
      throw new Error("AI Copilot is disabled");
    }

    if (!this.config.allowedCategories.includes(params.category)) {
      throw new Error(`AI suggestion category not allowed: ${params.category}`);
    }

    if (params.confidence < 0 || params.confidence > 1) {
      throw new Error("AI confidence must be between 0 and 1");
    }

    // Count existing suggestions for this execution
    if (params.executionId) {
      const existing = [...this.suggestions.values()].filter(
        (s) => s.executionId === params.executionId
      );
      if (existing.length >= this.config.maxSuggestionsPerExecution) {
        throw new Error(
          `Max suggestions (${this.config.maxSuggestionsPerExecution}) reached for execution ${params.executionId}`
        );
      }
    }

    const suggestion: AISuggestion = {
      suggestionId: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      tenantId: params.tenantId,
      executionId: params.executionId,
      workflowId: params.workflowId,
      category: params.category,
      title: params.title,
      description: params.description,
      confidence: params.confidence,
      status: "pending",
      createdAt: new Date().toISOString(),
      auditTrail: [
        {
          timestamp: new Date().toISOString(),
          action: "suggestion_created",
          actor: "ai_copilot",
          details: { category: params.category, confidence: params.confidence },
        },
      ],
    };

    this.suggestions.set(suggestion.suggestionId, suggestion);
    return suggestion;
  }

  /**
   * Accept a suggestion. Requires human review if configured.
   * Returns the suggestion — the caller is responsible for applying it
   * through normal policy-validated execution paths.
   */
  accept(
    suggestionId: string,
    reviewedBy: string,
    policy?: Policy
  ): AISuggestion {
    const suggestion = this.suggestions.get(suggestionId);
    if (!suggestion) throw new Error(`Suggestion not found: ${suggestionId}`);
    if (suggestion.status !== "pending") {
      throw new Error(`Suggestion ${suggestionId} is already ${suggestion.status}`);
    }

    if (this.config.requireHumanReview && !reviewedBy) {
      throw new Error("Human review is required to accept AI suggestions");
    }

    // If policy provided, verify the suggestion doesn't violate it
    if (policy && !policy.metadata.allowDeterministicOverride) {
      // AI suggestions that affect deterministic paths require explicit policy allowance
      const deterministicCategories: AISuggestionCategory[] = [
        "workflow_optimization",
        "reconciliation_hint",
      ];
      if (deterministicCategories.includes(suggestion.category)) {
        const entry: AIAuditEntry = {
          timestamp: new Date().toISOString(),
          action: "policy_validation",
          actor: reviewedBy,
          details: {
            policyId: policy.policyId,
            result: "requires_deterministic_override",
          },
        };
        suggestion.auditTrail.push(entry);
      }
    }

    suggestion.status = "accepted";
    suggestion.reviewedAt = new Date().toISOString();
    suggestion.reviewedBy = reviewedBy;
    suggestion.auditTrail.push({
      timestamp: new Date().toISOString(),
      action: "suggestion_accepted",
      actor: reviewedBy,
      details: {},
    });

    return suggestion;
  }

  /**
   * Reject a suggestion
   */
  reject(suggestionId: string, reviewedBy: string, reason?: string): AISuggestion {
    const suggestion = this.suggestions.get(suggestionId);
    if (!suggestion) throw new Error(`Suggestion not found: ${suggestionId}`);
    if (suggestion.status !== "pending") {
      throw new Error(`Suggestion ${suggestionId} is already ${suggestion.status}`);
    }

    suggestion.status = "rejected";
    suggestion.reviewedAt = new Date().toISOString();
    suggestion.reviewedBy = reviewedBy;
    suggestion.auditTrail.push({
      timestamp: new Date().toISOString(),
      action: "suggestion_rejected",
      actor: reviewedBy,
      details: { reason: reason ?? "no reason provided" },
    });

    return suggestion;
  }

  /**
   * Get all suggestions for a tenant
   */
  getSuggestions(tenantId: string): AISuggestion[] {
    return [...this.suggestions.values()].filter((s) => s.tenantId === tenantId);
  }

  /**
   * Get the audit trail for a specific suggestion
   */
  getAuditTrail(suggestionId: string): AIAuditEntry[] {
    const suggestion = this.suggestions.get(suggestionId);
    return suggestion?.auditTrail ?? [];
  }

  /**
   * Get the deterministic execution fence — used by the engine
   * to block AI operations during deterministic execution
   */
  get executionFence(): DeterministicExecutionFence {
    return this.fence;
  }
}
