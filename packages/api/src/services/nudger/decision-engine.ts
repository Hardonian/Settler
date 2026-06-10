import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface NudgeCandidate {
  invoiceId: string;
  targetContact: string;
  amount: number;
  dueDate: Date;
}

export class DecisionEngine {
  /**
   * Evaluates unpaid invoice candidates against active NudgePolicies.
   * Creates NudgeAction records either in 'dry_run' or 'execute' mode.
   */
  async evaluate(tenantId: string, candidates: NudgeCandidate[], mode: "dry_run" | "execute" = "dry_run") {
    const policies = await prisma.nudgePolicy.findMany({
      where: { tenantId, isActive: true },
    });

    if (policies.length === 0) {
      return { status: "no_active_policies", actionsCreated: 0, actions: [] };
    }

    // For Phase 1, we use the first active policy as the default
    const defaultPolicy = policies[0];
    const createdActions = [];

    for (const candidate of candidates) {
      const isOverdue = candidate.dueDate < new Date();
      if (!isOverdue) continue;

      // Prevent duplicate active nudges for the same invoice
      const existing = await prisma.nudgeAction.findFirst({
        where: {
          tenantId,
          invoiceId: candidate.invoiceId,
          status: { in: ["pending", "executed", "dry_run"] },
        },
      });

      if (existing) continue;

      const action = await prisma.nudgeAction.create({
        data: {
          tenantId,
          policyId: defaultPolicy.id,
          invoiceId: candidate.invoiceId,
          targetContact: candidate.targetContact,
          status: mode,
          metadata: {
            amount: candidate.amount,
            dueDate: candidate.dueDate.toISOString(),
          },
        },
      });

      createdActions.push(action);
    }

    return {
      status: "success",
      actionsCreated: createdActions.length,
      actions: createdActions,
    };
  }

  async getAnalytics(tenantId: string) {
    const total = await prisma.nudgeAction.count({ where: { tenantId } });
    const executed = await prisma.nudgeAction.count({ where: { tenantId, status: "executed" } });
    const dryRun = await prisma.nudgeAction.count({ where: { tenantId, status: "dry_run" } });

    return { total, executed, dryRun };
  }
}

export const decisionEngine = new DecisionEngine();
