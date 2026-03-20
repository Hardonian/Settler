import { prisma } from "@/shared/db/prismaClient";
import { getActiveTenantId } from "@/lib/auth/tenant";
import {
  buildCanonicalRunResultContract,
  ReconJobRecordLike,
  ReconResultRecordLike,
} from "@/lib/reconciliation/canonical-run-result";
import { buildReplayLabReport } from "@/lib/replay-lab/engine";
import { getExecutionGraph, verifyProofChain } from "@/lib/trust-graph/explorer";
import { RunListItem } from "@settler/types";
export type { RunListItem };

/**
 * Domain reader for Reconciliation Runs.
 * Bypasses HTTP overhead for internal Server Component calls.
 * Implements "Cheap Read" architecture by selecting specific fields
 * and minimizing contract overhead where possible.
 */

export async function getRunsList(tenantId: string, limit: number = 20): Promise<RunListItem[]> {
  if (!tenantId || tenantId === "—") return [];

  // 1. Fetch jobs
  const runs = await prisma.reconJob.findMany({
    where: { tenantId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 50),
    select: {
      id: true,
      createdAt: true,
      status: true,
      sourceAdapter: true,
      targetAdapter: true,
      reconStrategy: true,
      templateId: true,
      validationRules: true,
    },
  });

  if (runs.length === 0) return [];

  const runIds = runs.map((run: any) => run.id);

  // 2. Fetch latest results for these jobs
  const latestResults = await prisma.reconResult.findMany({
    where: {
      tenantId,
      reconJobId: { in: runIds },
    },
    orderBy: { startedAt: "desc" },
    select: {
      id: true,
      reconJobId: true,
      status: true,
      startedAt: true,
      completedAt: true,
      sourceCount: true,
      targetCount: true,
      matchedCount: true,
      unmatchedSourceCount: true,
      unmatchedTargetCount: true,
      conflictCount: true,
    },
  });

  // Map results by job ID (only keep the latest one per job)
  const latestResultByRunId = new Map<string, any>();
  for (const result of latestResults) {
    if (latestResultByRunId.has(result.reconJobId)) continue;
    latestResultByRunId.set(result.reconJobId, result);
  }

  // 3. Transform to standard List Item contract
  return runs.map((run: any) => {
    const result = latestResultByRunId.get(run.id);

    const contract = buildCanonicalRunResultContract({
      job: {
        id: run.id,
        status: run.status,
        tenantId,
        sourceAdapter: run.sourceAdapter,
        targetAdapter: run.targetAdapter,
        reconStrategy: run.reconStrategy,
        templateId: run.templateId,
        validationRules: run.validationRules,
      } as ReconJobRecordLike,
      result: result
        ? ({
            id: result.id,
            reconJobId: result.reconJobId,
            status: result.status,
            startedAt: result.startedAt,
            completedAt: result.completedAt,
            sourceCount: result.sourceCount,
            targetCount: result.targetCount,
            matchedCount: result.matchedCount,
            unmatchedSourceCount: result.unmatchedSourceCount,
            unmatchedTargetCount: result.unmatchedTargetCount,
            conflictCount: result.conflictCount,
          } as ReconResultRecordLike)
        : null,
    });

    return {
      run_id: run.id,
      created_at: run.createdAt.toISOString(),
      status: contract.lifecycle.status,
      status_label: contract.lifecycle.statusLabel,
      policy: run.reconStrategy || "default",
      manual: run.templateId === null,
      matched_records: contract.summary.matched,
      confidence:
        contract.summary.total > 0 ? contract.summary.matched / contract.summary.total : 1,
    } as RunListItem;
  });
}

export async function getRunDetail(tenantId: string, runId: string) {
  if (!tenantId || tenantId === "—" || !runId) return null;

  const run = await prisma.reconJob.findFirst({
    where: { id: runId, tenantId, deletedAt: null },
  });

  if (!run) return null;

  const result = await prisma.reconResult.findFirst({
    where: { reconJobId: runId, tenantId },
    orderBy: { startedAt: "desc" },
  });

  const contract = buildCanonicalRunResultContract({
    job: run as any,
    result: result as any,
  });

  return {
    id: run.id,
    status: contract.lifecycle.status,
    status_label: contract.lifecycle.statusLabel,
    summary_state: contract.summaryState,
    progress_state: contract.lifecycle.progressState,
    is_terminal: contract.lifecycle.isTerminal,
    progress_percent: contract.lifecycle.progressPercent,
    summary: contract.summary,
    metadata: { sourceAdapter: run.sourceAdapter, targetAdapter: run.targetAdapter },
    policy: { id: "default", hash: "default-policy" },
    fingerprint: (result?.metadata as Record<string, unknown> | null)?.fingerprint || null,
    created_at: run.createdAt.toISOString(),
    tenant_id: tenantId,
  };
}

/**
 * Aggregates high-level stats for the operator dashboard.
 * Optimizes for a single sequential read to avoid multiple round-trips if possible,
 * but Promise.all is sufficient for standard connection pooling.
 */
export async function getDashboardStats() {
  const { prisma } = await import("@/shared/db/prismaClient");
  const tenantId = await getActiveTenantId();
  if (!tenantId) return null;

  try {
    const [totalJobs, totalUnmatchedRuns, driftEvents, recentActivity] = await Promise.all([
      prisma.reconJob.count({ where: { tenantId, deletedAt: null } }),
      // Count runs with unmatched records (status completed with unmatched or error)
      prisma.reconResult.count({
        where: {
          tenantId,
          status: { in: ["completed", "completed_mismatch"] },
          OR: [{ unmatchedSourceCount: { gt: 0 } }, { unmatchedTargetCount: { gt: 0 } }],
        },
      }),
      prisma.driftEvent.count({ where: { tenantId } }),
      prisma.reconJob.findMany({
        where: { tenantId, deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          status: true,
          createdAt: true,
          name: true,
          metadata: true,
          results: {
            orderBy: { startedAt: "desc" },
            take: 1,
            select: {
              status: true,
            },
          },
        },
      }),
    ]);

    return {
      metrics: {
        total_runs: totalJobs,
        // Canonical terminology: unmatched runs = runs with unmatched records
        unmatched_runs: totalUnmatchedRuns,
        drift_events_detected: driftEvents,
        integrity_score:
          totalJobs > 0 ? Math.round(((totalJobs - totalUnmatchedRuns) / totalJobs) * 100) : 100,
      },
      recent: recentActivity.map((run: any) => ({
        id: run.id,
        status: run.results?.[0]?.status || run.status,
        timestamp: run.createdAt.toISOString(),
        description:
          (run.metadata as Record<string, unknown> | null)?.description ||
          run.name ||
          `Run ${run.id.slice(0, 8)}`,
      })),
    };
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return null;
  }
}

export async function getRunReplay(tenantId: string, runId: string) {
  if (!tenantId || tenantId === "—" || !runId) return null;
  // Use the existing Replay Lab engine directly
  try {
    return buildReplayLabReport(runId);
  } catch (err) {
    console.error(`[RunsReader] Error building replay report for ${runId}:`, err);
    return null;
  }
}

export async function getRunEvidence(tenantId: string, runId: string) {
  if (!tenantId || tenantId === "—" || !runId) return null;

  const result = await prisma.reconResult.findFirst({
    where: { reconJobId: runId, tenantId },
    orderBy: { startedAt: "desc" },
  });

  if (!result) return null;

  try {
    const graph = getExecutionGraph({
      tenantId,
      runId,
      metadata: (result.metadata as Record<string, unknown> | null) || null,
      summary: (result.summary as Record<string, unknown> | null) || null,
      proofCapsule: (result.proofCapsule as any) || null,
    });

    const verification = verifyProofChain({
      tenantId,
      runId,
      metadata: (result.metadata as Record<string, unknown> | null) || null,
      summary: (result.summary as Record<string, unknown> | null) || null,
      proofCapsule: (result.proofCapsule as any) || null,
    });

    return {
      run_id: runId,
      evidence: {
        proof_capsule: {
          ...((result.proofCapsule as Record<string, unknown>) || {}),
          graphHash: graph.graphHash,
          proofNodeRefs: verification.proofNodeRefs,
        },
        artifact_path: `/tenant/${tenantId}/runs/${runId}/evidence.json`,
      },
    };
  } catch (err) {
    console.error(`[RunsReader] Error building evidence for ${runId}:`, err);
    return null;
  }
}

/**
 * Fetches real drift events for the active tenant.
 * Maps Prisma fields to UI-friendly common alert schema.
 */
export async function getAlertsList(limit: number = 30) {
  const { prisma } = await import("@/shared/db/prismaClient");
  const tenantId = await getActiveTenantId();
  if (!tenantId) return [];

  try {
    const alerts = await prisma.driftEvent.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        driftType: true,
        severity: true,
        fieldPath: true,
        acknowledged: true,
        createdAt: true,
        metadata: true,
        reconJobId: true,
      },
    });

    return alerts.map((alert: any) => ({
      id: alert.id,
      type: alert.driftType,
      severity: (alert.severity === "critical"
        ? "critical"
        : alert.severity === "error"
          ? "critical"
          : "warning") as "critical" | "warning" | "info",
      message:
        (alert.metadata as Record<string, unknown> | null)?.message ||
        `Drift detected in ${alert.fieldPath || "contract"}`,
      component:
        (alert.metadata as Record<string, unknown> | null)?.component ||
        (alert.reconJobId ? "reconciliation" : "system"),
      timestamp: alert.createdAt.toISOString(),
      acknowledged: alert.acknowledged,
      run_id: alert.reconJobId,
    }));
  } catch (error) {
    console.error("Failed to fetch alerts:", error);
    return [];
  }
}

/**
 * Fetches real reconciliation matches for the active tenant.
 */
export async function getMatchesList(limit: number = 50) {
  const { prisma } = await import("@/shared/db/prismaClient");
  const tenantId = await getActiveTenantId();
  if (!tenantId) return [];

  try {
    const matches = await prisma.reconciliationMatch.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        sourceTransaction: {
          select: {
            id: true,
            amount: true,
            currency: true,
            transactionDate: true,
          },
        },
      },
    });

    return matches.map((match: any) => ({
      id: match.id,
      runId: match.runId,
      matchType: match.matchType,
      confidence: Number(match.confidence),
      amount: Number(match.sourceTransaction.amount),
      currency: match.sourceTransaction.currency,
      timestamp: match.createdAt.toISOString(),
      status: match.reviewed ? "reviewed" : "pending",
      discrepancy: match.amountDiff ? Number(match.amountDiff) : 0,
    }));
  } catch (error) {
    console.error("Failed to fetch matches:", error);
    return [];
  }
}

/**
 * Fetches contract versions (policies) for the active tenant.
 */
export async function getPoliciesList(limit: number = 20) {
  const { prisma } = await import("@/shared/db/prismaClient");
  const tenantId = await getActiveTenantId();
  if (!tenantId) return [];

  try {
    const policies = await prisma.contractVersion.findMany({
      where: { tenantId },
      orderBy: { updatedAt: "desc" },
      take: limit,
      include: {
        _count: {
          select: { driftEvents: true },
        },
      },
    });

    return policies.map((p: any) => ({
      id: p.id,
      name: p.contractName,
      version: p.version,
      status: p.isActive ? "active" : "deprecated",
      driftCount: p._count.driftEvents,
      updatedAt: p.updatedAt.toISOString(),
      schema: p.schemaDefinition,
    }));
  } catch (error) {
    console.error("Failed to fetch policies:", error);
    return [];
  }
}

export interface AuditLogItem {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  actor: string;
  ip: string;
  timestamp: string;
  details: string;
}

/**
 * Fetches audit log entries for the active tenant.
 */
export async function getAuditLogs(limit: number = 50): Promise<AuditLogItem[]> {
  const { prisma } = await import("@/shared/db/prismaClient");
  const tenantId = await getActiveTenantId();
  if (!tenantId) return [];

  try {
    const logs = await prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        action: true,
        resourceType: true,
        resourceId: true,
        actorType: true,
        actorId: true,
        ipAddress: true,
        createdAt: true,
        metadata: true,
      },
    });

    return logs.map((log: any) => ({
      id: log.id,
      action: log.action,
      resource: log.resourceType,
      resourceId: log.resourceId,
      actor: log.actorType || "system",
      ip: log.ipAddress || "—",
      timestamp: log.createdAt.toISOString(),
      details:
        (log.metadata as Record<string, unknown> | null)?.message ||
        `Performed ${log.action} on ${log.resourceType}`,
    }));
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    return [];
  }
}
