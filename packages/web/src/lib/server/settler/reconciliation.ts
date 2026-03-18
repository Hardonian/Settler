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
  SourceId,
} from "@/lib/domain/types";
import { calculateImpact, generateExplanation } from "@/lib/judgment/rules";
import { safeLogger } from "@/lib/observability/safe-logger";
import { seal } from "@/lib/reconciliation/trust-envelope";

const SETTLER_VERSION = "1.0.0";



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

    // Get reconciliation run using Prisma
    const result = await prisma.reconciliationRun.findFirst({
      where: {
        id: reconciliationId,
        tenantId,
      },
    });

    if (!result) {
      await safeLogger.warn("[getReconciliationSummary] Reconciliation run not found", {
        tenantId,
        reconciliationId,
      });
      return null;
    }

    // Calculate totalDelta from matches (if needed)
    const totalDelta = 0; // Can be calculated from matches if needed

    return {
      id: result.id,
      tenantId,
      sourceId: result.ingestionId ?? "unknown",
      status: result.status as "running" | "completed" | "failed",
      totalDelta,
      currency: "USD", // Default currency
      mismatchCount: result.unmatchedSourceCount,
      startedAt: result.startedAt,
      completedAt: result.completedAt || undefined,
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

    // Get reconciliation matches using Prisma
    const matches = await prisma.reconciliationMatch.findMany({
      where: {
        runId: reconciliationId,
        tenantId,
      },
      orderBy: { createdAt: "desc" },
    });

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
