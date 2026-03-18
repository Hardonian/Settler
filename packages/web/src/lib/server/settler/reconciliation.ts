/**
 * Reconciliation Service
 *
 * Runs reconciliation jobs and retrieves reconciliation summaries.
 */

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/shared/db/prismaClient";
import type {
  ReconciliationSummary,
  ReconciliationItem,
  TenantId,
} from "@/lib/domain/types";
import { calculateImpact, generateExplanation } from "@/lib/judgment/rules";
import { safeLogger } from "@/lib/observability/safe-logger";

function mapStatus(raw: string | null | undefined): "running" | "completed" | "failed" {
  const value = (raw || "").toLowerCase();
  if (value === "completed" || value === "succeeded" || value === "success") {
    return "completed";
  }
  if (value === "failed" || value === "error" || value === "dead" || value === "canceled") {
    return "failed";
  }
  return "running";
}

/**
 * Get reconciliation summary by ID
 */
export async function getReconciliationSummary(
  tenantId: TenantId,
  reconciliationId: string
): Promise<ReconciliationSummary | null> {
  try {
    const supabase = await createClient();

    // Verify tenant access
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      await safeLogger.warn("[getReconciliationSummary] User not authenticated", {
        tenantId,
        reconciliationId,
      });
      return null;
    }

    // Prefer direct reconciliation_run lookup first
    const run = await prisma.reconciliationRun.findFirst({
      where: {
        id: reconciliationId,
        tenantId,
      },
    });

    if (run) {
      return {
        id: run.id,
        tenantId,
        sourceId: run.ingestionId ?? "unknown",
        status: mapStatus(run.status),
        totalDelta: 0,
        currency: "USD",
        mismatchCount: run.unmatchedSourceCount + run.unmatchedTargetCount,
        startedAt: run.startedAt,
        completedAt: run.completedAt || undefined,
      };
    }

    // Fallback: treat the ID as a recon_job and summarize from latest recon_result.
    const job = await prisma.reconJob.findFirst({
      where: {
        id: reconciliationId,
        tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    if (!job) {
      await safeLogger.warn("[getReconciliationSummary] Reconciliation subject not found", {
        tenantId,
        reconciliationId,
      });
      return null;
    }

    const latestResult = await prisma.reconResult.findFirst({
      where: {
        reconJobId: job.id,
        tenantId,
      },
      orderBy: {
        startedAt: "desc",
      },
      select: {
        status: true,
        startedAt: true,
        completedAt: true,
        unmatchedSourceCount: true,
        unmatchedTargetCount: true,
        conflictCount: true,
      },
    });

    return {
      id: job.id,
      tenantId,
      sourceId: job.id,
      status: mapStatus(latestResult?.status),
      totalDelta: 0,
      currency: "USD",
      mismatchCount:
        (latestResult?.unmatchedSourceCount || 0) +
        (latestResult?.unmatchedTargetCount || 0) +
        (latestResult?.conflictCount || 0),
      startedAt: latestResult?.startedAt || job.createdAt,
      completedAt: latestResult?.completedAt || undefined,
    };
  } catch (error) {
    await safeLogger.error("[getReconciliationSummary] Unexpected error", {
      tenantId,
      reconciliationId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return null;
  }
}

/**
 * List reconciliation items for a reconciliation
 */
export async function listReconciliationItems(
  tenantId: TenantId,
  reconciliationId: string
): Promise<ReconciliationItem[]> {
  try {
    const supabase = await createClient();

    // Verify tenant access
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      await safeLogger.warn("[listReconciliationItems] User not authenticated", {
        tenantId,
        reconciliationId,
      });
      return [];
    }

    // Prefer direct run-id match lookup.
    let matches = await prisma.reconciliationMatch.findMany({
      where: {
        runId: reconciliationId,
        tenantId,
      },
      orderBy: { createdAt: "desc" },
    });

    // Fallback: if this is a recon_job ID, map to run IDs via metadata provenance.
    if (matches.length === 0) {
      const relatedRuns = await prisma.reconciliationRun.findMany({
        where: {
          tenantId,
          OR: [
            { metadata: { path: ["jobId"], equals: reconciliationId } },
            { metadata: { path: ["job_id"], equals: reconciliationId } },
            { metadata: { path: ["reconJobId"], equals: reconciliationId } },
            { metadata: { path: ["recon_job_id"], equals: reconciliationId } },
            { metadata: { path: ["matchingConfig", "jobId"], equals: reconciliationId } },
          ],
        },
        select: {
          id: true,
        },
      });

      const relatedRunIds = relatedRuns.map((entry: { id: string }) => entry.id);
      if (relatedRunIds.length > 0) {
        matches = await prisma.reconciliationMatch.findMany({
          where: {
            tenantId,
            runId: { in: relatedRunIds },
          },
          orderBy: { createdAt: "desc" },
        });
      }
    }

    // Get source transactions for matches
    const sourceTransactionIds = matches.map(
      (m: { sourceTransactionId: string }) => m.sourceTransactionId
    );
    const sourceTransactions = (await prisma.normalizedTransaction.findMany({
      where: {
        id: { in: sourceTransactionIds },
        tenantId,
      },
    })) as Array<{
      id: string;
      amount: number;
      currency: string;
      date: Date;
      description: string | null;
    }>;

    const sourceTransactionMap = new Map(sourceTransactions.map((t) => [t.id, t]));

    if (!matches || matches.length === 0) {
      return [];
    }

    // Transform matches to ReconciliationItem objects
    const items: ReconciliationItem[] = [];

    for (const match of matches) {
      const sourceTransaction = sourceTransactionMap.get(match.sourceTransactionId);
      if (!sourceTransaction) {
        continue; // Skip if source transaction not found
      }

      const sourceAmount = Number(sourceTransaction.amount);
      const targetAmount = match.targetTransactionId
        ? sourceAmount - (match.amountDiff ? Number(match.amountDiff) : 0) // Use amountDiff if available
        : 0;
      const delta = sourceAmount - targetAmount;

      const impact = calculateImpact(delta, sourceTransaction.currency, Number(match.confidence));
      const explanation = generateExplanation(
        {
          type: "reconciliation_item",
          sourceId: match.sourceTransactionId,
          timestamp: sourceTransaction.date,
          rawData: {
            description: sourceTransaction.description,
            amount: sourceAmount,
          },
        },
        delta
      );

      items.push({
        id: match.id,
        reconciliationId,
        sourceId: match.sourceTransactionId,
        sourceAmount,
        sourceCurrency: sourceTransaction.currency,
        targetAmount,
        targetCurrency: sourceTransaction.currency,
        delta,
        status:
          match.matchType === "exact" || match.matchType === "fuzzy" ? "matched" : "unmatched",
        impact,
        explanation,
        urgency: impact.riskScore > 0.7 ? "high" : impact.riskScore > 0.5 ? "medium" : "low",
        createdAt: match.createdAt,
      });
    }

    // Sort by impact (risk score descending)
    items.sort((a, b) => b.impact.riskScore - a.impact.riskScore);

    return items;
  } catch (error) {
    await safeLogger.error("[listReconciliationItems] Unexpected error", {
      tenantId,
      reconciliationId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return [];
  }
}
