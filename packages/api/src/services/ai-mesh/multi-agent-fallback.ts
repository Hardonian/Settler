/**
 * Multi-Agent Fallback System
 *
 * This service no longer simulates AI execution. Until Settler has a real,
 * tenant-safe executor, all calls fail closed with an explicit unavailable
 * contract so callers cannot mistake planning metadata for completed work.
 */

import crypto from "node:crypto";
import { logInfo, logWarn } from "../../utils/logger";
import { AIRouter, AIModel } from "./ai-router";

export interface AgentTask {
  id: string;
  type: "ingestion" | "mapping" | "validation" | "transform" | "drift_detection";
  input: Record<string, unknown>;
  retryCount?: number;
}

export interface AgentResponse {
  success: boolean;
  status: "completed" | "unavailable" | "failed";
  result?: Record<string, unknown>;
  error?: string;
  model?: AIModel;
  cost?: number;
  reasonCode?: string;
  attemptedModels?: AIModel[];
  degraded?: boolean;
}

export class MultiAgentFallback {
  private router: AIRouter;
  private fallbackChain: AIModel[];

  constructor(router: AIRouter) {
    this.router = router;
    this.fallbackChain = [
      "gpt-4",
      "claude-3-opus",
      "claude-3-sonnet",
      "gpt-3.5-turbo",
      "claude-3-haiku",
      "local-llm",
    ];
  }

  /**
   * Execute task with automatic fallback.
   *
   * Settler does not currently ship a production-safe multi-agent executor in
   * the API runtime, so this method returns an explicit unavailable contract.
   */
  async executeWithFallback(task: AgentTask, primaryModel?: AIModel): Promise<AgentResponse> {
    const models = primaryModel
      ? [primaryModel, ...this.fallbackChain.filter((m) => m !== primaryModel)]
      : this.fallbackChain;

    logWarn("multi_agent_executor_unavailable", {
      taskId: task.id,
      type: task.type,
      attemptedModels: models,
      retryCount: task.retryCount ?? 0,
      reasonCode: "ai_mesh_executor_unavailable",
    });

    return {
      success: false,
      status: "unavailable",
      error:
        "AI mesh execution is unavailable in this runtime. Settler will not simulate multi-agent fallback without a real executor.",
      model: models[0],
      reasonCode: "ai_mesh_executor_unavailable",
      attemptedModels: models,
      degraded: true,
    };
  }

  /**
   * Handle ingestion failure
   */
  async handleIngestionFailure(
    error: Error,
    context: Record<string, unknown>
  ): Promise<AgentResponse> {
    const input = { error: error.message, context };
    return this.executeWithFallback({
      id: buildDeterministicTaskId("ingestion", input),
      type: "ingestion",
      input,
      retryCount: 0,
    });
  }

  /**
   * Handle mapping uncertainty
   */
  async handleMappingUncertainty(
    uncertainFields: string[],
    data: Record<string, unknown>
  ): Promise<AgentResponse> {
    const input = { uncertainFields, data };
    return this.executeWithFallback(
      {
        id: buildDeterministicTaskId("mapping", input),
        type: "mapping",
        input,
        retryCount: 0,
      },
      "gpt-4"
    ); // Use high-accuracy model for mapping
  }

  /**
   * Handle schema deviation
   */
  async handleSchemaDeviation(
    expected: Record<string, unknown>,
    actual: Record<string, unknown>
  ): Promise<AgentResponse> {
    const input = { expected, actual };
    return this.executeWithFallback({
      id: buildDeterministicTaskId("schema", input),
      type: "drift_detection",
      input,
      retryCount: 0,
    });
  }
}

function buildDeterministicTaskId(
  prefix: "ingestion" | "mapping" | "schema",
  payload: Record<string, unknown>
): string {
  const digest = crypto
    .createHash("sha256")
    .update(`${prefix}:${stableSerialize(payload)}`)
    .digest("hex")
    .slice(0, 16);

  return `${prefix}-${digest}`;
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
      left.localeCompare(right)
    );
    return `{${entries
      .map(([key, item]) => `${JSON.stringify(key)}:${stableSerialize(item)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}
