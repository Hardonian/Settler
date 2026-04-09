/**
 * Policy Simulator
 *
 * Evaluates policies against historical execution data.
 * Allows "what-if" analysis: what would happen if a policy
 * were changed, applied retroactively, or combined with others.
 */

import type { Policy, Execution, PlatformEvent } from "./primitives";

export interface SimulationRequest {
  /** Policy to simulate */
  policy: Policy;
  /** Historical executions to evaluate against */
  executions: Execution[];
  /** Historical events (optional, for deeper analysis) */
  events?: PlatformEvent[];
}

export interface SimulationResult {
  policyId: string;
  policyVersion: string;
  executionsEvaluated: number;
  executionsAllowed: number;
  executionsDenied: number;
  budgetViolations: BudgetViolation[];
  identityViolations: IdentityViolation[];
  retroactiveImpact: RetroactiveImpact;
  simulatedAt: string;
}

export interface BudgetViolation {
  executionId: string;
  metric: string;
  actual: number;
  limit: number;
  exceeded: boolean;
}

export interface IdentityViolation {
  executionId: string;
  requiredRole?: string;
  actualRole?: string;
  missingScopes: string[];
}

export interface RetroactiveImpact {
  /** How many past executions would have been blocked */
  wouldBlock: number;
  /** How many past executions would need re-evaluation */
  wouldRequireReview: number;
  /** Percentage of executions affected */
  impactPercentage: number;
}

export class PolicySimulator {
  /**
   * Simulate a policy against historical executions
   */
  simulate(request: SimulationRequest): SimulationResult {
    const { policy, executions } = request;
    const budgetViolations: BudgetViolation[] = [];
    const identityViolations: IdentityViolation[] = [];
    let allowed = 0;
    let denied = 0;

    for (const execution of executions) {
      let isAllowed = true;

      // Check identity constraints
      const executionRole = (execution as Execution & { actorRole?: string }).actorRole;
      if (policy.identity.requiredRole && executionRole !== policy.identity.requiredRole) {
        identityViolations.push({
          executionId: execution.executionId,
          requiredRole: policy.identity.requiredRole,
          actualRole: executionRole,
          missingScopes: [],
        });
        isAllowed = false;
      }

      // Check budget constraints (using metadata from execution if available)
      const execMeta = (execution as Execution & { metrics?: Record<string, number> }).metrics;
      if (execMeta) {
        const checks: Array<{ metric: string; actual: number; limit: number }> = [
          {
            metric: "compute_units",
            actual: execMeta.compute_units ?? 0,
            limit: policy.budgets.maxComputeUnits,
          },
          {
            metric: "memory_units",
            actual: execMeta.memory_units ?? 0,
            limit: policy.budgets.maxMemoryUnits,
          },
          {
            metric: "cas_io_units",
            actual: execMeta.cas_io_units ?? 0,
            limit: policy.budgets.maxCasIoUnits,
          },
          {
            metric: "replay_calls",
            actual: execMeta.replay_calls ?? 0,
            limit: policy.budgets.maxReplayCalls,
          },
        ];

        for (const check of checks) {
          if (check.actual > check.limit) {
            budgetViolations.push({
              executionId: execution.executionId,
              metric: check.metric,
              actual: check.actual,
              limit: check.limit,
              exceeded: true,
            });
            isAllowed = false;
          }
        }
      }

      if (isAllowed) allowed++;
      else denied++;
    }

    const total = executions.length;
    return {
      policyId: policy.policyId,
      policyVersion: policy.version,
      executionsEvaluated: total,
      executionsAllowed: allowed,
      executionsDenied: denied,
      budgetViolations,
      identityViolations,
      retroactiveImpact: {
        wouldBlock: denied,
        wouldRequireReview: budgetViolations.length,
        impactPercentage: total > 0 ? (denied / total) * 100 : 0,
      },
      simulatedAt: new Date().toISOString(),
    };
  }

  /**
   * Compare two policies against the same execution history
   */
  compare(
    policyA: Policy,
    policyB: Policy,
    executions: Execution[]
  ): { resultA: SimulationResult; resultB: SimulationResult; diff: PolicyDiff } {
    const resultA = this.simulate({ policy: policyA, executions });
    const resultB = this.simulate({ policy: policyB, executions });

    return {
      resultA,
      resultB,
      diff: {
        allowedDelta: resultB.executionsAllowed - resultA.executionsAllowed,
        deniedDelta: resultB.executionsDenied - resultA.executionsDenied,
        newViolations: resultB.budgetViolations.filter(
          (bv) =>
            !resultA.budgetViolations.some(
              (av) => av.executionId === bv.executionId && av.metric === bv.metric
            )
        ),
        resolvedViolations: resultA.budgetViolations.filter(
          (av) =>
            !resultB.budgetViolations.some(
              (bv) => bv.executionId === av.executionId && bv.metric === av.metric
            )
        ),
      },
    };
  }
}

export interface PolicyDiff {
  allowedDelta: number;
  deniedDelta: number;
  newViolations: BudgetViolation[];
  resolvedViolations: BudgetViolation[];
}
