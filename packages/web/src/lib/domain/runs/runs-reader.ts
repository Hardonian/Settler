import { prisma } from "@/shared/db/prismaClient";
import {
  buildCanonicalRunResultContract,
  ReconJobRecordLike,
  ReconResultRecordLike,
} from "@/lib/reconciliation/canonical-run-result";
import { buildReplayLabReport } from "@/lib/replay-lab/engine";
import { getExecutionGraph, verifyProofChain } from "@/lib/trust-graph/explorer";

/**
 * Domain reader for Reconciliation Runs.
 * Bypasses HTTP overhead for internal Server Component calls.
 * Implements "Cheap Read" architecture by selecting specific fields
 * and minimizing contract overhead where possible.
 */

export interface RunListItem {
  run_id: string;
  created_at: string;
  status: string;
  status_label: string;
  policy: string;
}

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

  const runIds = runs.map((run) => run.id);

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
  return runs.map((run) => {
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
      policy: "default",
    };
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
