/**
 * Synthetic User Simulator Agent
 *
 * Simulates user traffic, realistic transactional patterns, and stress workloads
 * to validate reconciliation throughput, latency bounds, and edge scenarios.
 *
 * GOVERNANCE: Strictly emits draft-only job requests (autoExecute: false, requireApproval: true).
 * No synthetic transaction generation or load execution occurs without an explicit signed policy token.
 */

import {
  BaseAgent,
  AgentJobDraft,
  AgentExecutionContext,
  assertSignedPolicyToken,
  policyPayloadHash,
} from "./orchestrator";
import { logInfo } from "../../utils/logger";

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  tenantId: string;
  targetTps: number;
  durationSeconds: number;
  pattern: "burst" | "sustained" | "jitter" | "reconciliation_spike";
  parameters: {
    transactionCount: number;
    discrepancyRate?: number;
    currency?: string;
  };
  governance: {
    riskLevel: "low" | "medium" | "high";
    estimatedImpact: string;
  };
}

export class SyntheticUserSimulatorAgent extends BaseAgent {
  id = "synthetic-user-simulator";
  name = "Synthetic User Simulator";
  type = "synthetic" as const;

  private activeSimulations: Map<string, SimulationScenario> = new Map();
  private lastSimulation?: Date;
  private completedSimulationsCount = new Map<string, number>();

  async initialize(): Promise<void> {
    this.enabled = true;
    logInfo("Synthetic User Simulator Agent initialized in draft-governed mode");
  }

  async execute(
    action: string,
    params: Record<string, unknown>,
    context?: AgentExecutionContext
  ): Promise<unknown> {
    const tenantId = context?.tenantId;
    if (!tenantId) {
      throw new Error("Tenant context is required for synthetic simulation agent execution");
    }

    switch (action) {
      case "plan_simulation":
        return this.planSimulation({ ...params, tenantId });

      case "run_simulation":
        return await this.runSimulation(params, context);

      case "get_active_simulations":
        return Array.from(this.activeSimulations.values()).filter(
          (scenario) => scenario.tenantId === tenantId
        );

      case "get_stats":
        return {
          activeSimulations: Array.from(this.activeSimulations.values()).filter(
            (scenario) => scenario.tenantId === tenantId
          ).length,
          completedSimulations: this.completedSimulationsCount.get(tenantId) ?? 0,
          governanceMode: "draft_only_approval_required",
        };

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  async getStatus(): Promise<{
    enabled: boolean;
    lastExecution?: Date;
    metrics?: Record<string, unknown>;
  }> {
    return {
      enabled: this.enabled,
      ...(this.lastSimulation ? { lastExecution: this.lastSimulation } : {}),
      metrics: {
        activeSimulations: this.activeSimulations.size,
        completedSimulations: Array.from(this.completedSimulationsCount.values()).reduce(
          (sum, count) => sum + count,
          0
        ),
        governanceMode: "draft_only_approval_required",
      },
    };
  }

  /**
   * Plans a synthetic simulation and emits a draft-only job request.
   */
  planSimulation(params: Record<string, unknown>): {
    scenario: SimulationScenario;
    draftJob: AgentJobDraft;
  } {
    const tenantId = params.tenantId as string;
    if (!tenantId) throw new Error("Tenant context is required to plan a simulation");
    const targetTps = Number(params.targetTps) || 50;
    const durationSeconds = Number(params.durationSeconds) || 60;
    const pattern = (params.pattern as SimulationScenario["pattern"]) || "sustained";
    const transactionCount = targetTps * durationSeconds;

    const scenario: SimulationScenario = {
      id: `sim_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: (params.name as string) || `Simulation-${pattern}-${targetTps}tps`,
      description:
        (params.description as string) ||
        `Synthetic simulation targeting ${targetTps} TPS over ${durationSeconds}s`,
      tenantId,
      targetTps,
      durationSeconds,
      pattern,
      parameters: {
        transactionCount,
        discrepancyRate: Number(params.discrepancyRate) || 0.05,
        currency: (params.currency as string) || "USD",
      },
      governance: {
        riskLevel: targetTps > 500 ? "high" : "medium",
        estimatedImpact: `Generates ${transactionCount} synthetic records across ${durationSeconds}s`,
      },
    };

    const draftJob = this.createDraftJob(scenario);
    this.activeSimulations.set(scenario.id, scenario);
    this.emit("draft_job_created", draftJob);

    return { scenario, draftJob };
  }

  /**
   * Generates strictly draft-only job request for simulation execution via JobForgeClient
   */
  createDraftJob(scenario: SimulationScenario): AgentJobDraft {
    return {
      agentId: this.id,
      jobType: "synthetic.simulation.execute",
      payload: {
        scenarioId: scenario.id,
        tenantId: scenario.tenantId,
        targetTps: scenario.targetTps,
        durationSeconds: scenario.durationSeconds,
        pattern: scenario.pattern,
        parameters: scenario.parameters,
      },
      autoExecute: false,
      requireApproval: true,
      governance: {
        riskLevel: scenario.governance.riskLevel,
        estimatedImpact: scenario.governance.estimatedImpact,
        requiresHumanReview: true,
        signedPolicyBound: "pb_synthetic_sim_draft_v1",
      },
    };
  }

  /**
   * Run simulation - enforces signed policy token before execution.
   */
  private async runSimulation(
    params: Record<string, unknown>,
    context?: AgentExecutionContext
  ): Promise<{
    scenarioId: string;
    status: string;
    simulatedRecords: number;
  }> {
    // SECURITY INVARIANT: Autonomous simulation execution forbidden without verified signed policy token
    assertSignedPolicyToken(params.policyToken as string | undefined, {
      tenantId: context?.tenantId ?? "",
      agentId: this.id,
      action: "run_simulation",
      payloadHash: policyPayloadHash(params),
      nonce: params.policyNonce as string | undefined,
    });

    const tenantId = context?.tenantId;
    const scenarioId = params.scenarioId as string;
    const scenario = scenarioId ? this.activeSimulations.get(scenarioId) : undefined;
    if (!tenantId || !scenario || scenario.tenantId !== tenantId) {
      throw new Error("Approved simulation scenario not found for tenant");
    }
    const transactionCount = scenario.parameters.transactionCount;

    logInfo(`Running signed synthetic simulation: ${scenarioId}`, {
      scenarioId,
      transactionCount,
    });

    this.lastSimulation = new Date();
    this.activeSimulations.delete(scenarioId);
    this.completedSimulationsCount.set(
      tenantId,
      (this.completedSimulationsCount.get(tenantId) ?? 0) + 1
    );

    return {
      scenarioId,
      status: "completed_under_policy",
      simulatedRecords: transactionCount,
    };
  }
}
