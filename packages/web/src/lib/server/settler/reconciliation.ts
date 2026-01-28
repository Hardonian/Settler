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

export interface ReconciliationParams {
  sourceId: SourceId;
  targetAdapter?: string;
  rules?: Array<{ field: string; tolerance?: number; window?: string }>;
}

/**
 * Run a reconciliation for a tenant
 */
export async function runReconciliation(
  tenantId: TenantId,
  params: ReconciliationParams
): Promise<ReconciliationSummary | null> {
  try {
    const supabase = await createClient();

    // Verify tenant access
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      await safeLogger.warn("[runReconciliation] User not authenticated", {
        tenantId,
        sourceId: params.sourceId,
      });
      return null;
    }

    // Get user ID for reconciliation run
    const userId = user.id;
    
    // Create reconciliation run using Prisma
    const result = await prisma.reconciliationRun.create({
      data: {
        tenantId,
        userId,
        name: `Reconciliation for ${params.sourceId}`,
        status: 'running',
        startedAt: new Date(),
        sourceCount: 0,
        targetCount: 0,
        matchedCount: 0,
        unmatchedSourceCount: 0,
        unmatchedTargetCount: 0,
      },
    });
    
    // Get source transactions (from the ingestion source)
    const sourceTransactions = await prisma.normalizedTransaction.findMany({
      where: {
        tenantId,
        sourceId: params.sourceId,
      },
      orderBy: { date: 'asc' },
    });

    // Get target transactions (receipts - from different source or same source with different type)
    // For 10% scope, we'll match against receipts uploaded separately
    // In production, this would be configurable (bank vs receipts, etc.)
    const targetTransactions = await prisma.normalizedTransaction.findMany({
      where: {
        tenantId,
        sourceId: { not: params.sourceId }, // Different source (e.g., receipts)
      },
      orderBy: { date: 'asc' },
    });

    // Run deterministic matching
    const { runDeterministicMatching } = await import("@/lib/reconciliation/deterministic-matcher");
    
    const matchResult = await runDeterministicMatching(
      tenantId,
      result.id,
      sourceTransactions.map(t => ({
        id: t.id,
        amount: Number(t.amount),
        date: t.date,
        description: t.description,
        currency: t.currency,
      })),
      targetTransactions.map(t => ({
        id: t.id,
        amount: Number(t.amount),
        date: t.date,
        description: t.description,
        currency: t.currency,
      })),
      {
        amountTolerance: params.rules?.find(r => r.field === 'amount')?.tolerance || 0.01,
        dateWindowDays: params.rules?.find(r => r.field === 'date')?.window ? 
          parseInt(params.rules.find(r => r.field === 'date')!.window!.replace('days', '')) : 3,
        requireExactMerchant: true,
      }
    );

    // Calculate totals for return value
    const totalAmountSource = sourceTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalAmountTarget = targetTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

    // Update reconciliation run with results
    await prisma.reconciliationRun.update({
      where: { id: result.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        sourceCount: sourceTransactions.length,
        targetCount: targetTransactions.length,
        matchedCount: matchResult.matchedCount,
        unmatchedSourceCount: matchResult.unmatchedCount,
        unmatchedTargetCount: targetTransactions.length - matchResult.matchedCount,
        confidenceAvg: matchResult.matches.length > 0
          ? matchResult.matches.reduce((sum, m) => sum + m.confidence, 0) / matchResult.matches.length
          : null,
      },
    });

    // Track usage: Reconciliation job execution
    try {
      const { trackReconciliationTransaction } = await import("@/middleware/usage-tracking");
      // Get billing account from tenant
      const { data: billingAccount } = await (supabase
        .from("billing_accounts")
        .select("id, user_id")
        .eq("tenant_id", tenantId)
        .eq("status", "active")
        .is("deleted_at", null)
        .single() as any);
      
      if (billingAccount) {
        await trackReconciliationTransaction(
          billingAccount.id,
          tenantId,
          billingAccount.user_id,
          sourceTransactions.length, // Track actual transaction count
          params.sourceId
        );
      }
    } catch (usageError) {
      // Don't fail reconciliation if usage tracking fails
      await safeLogger.error("[runReconciliation] Usage tracking failed", {
        tenantId,
        error: usageError instanceof Error ? usageError.message : String(usageError),
        stack: usageError instanceof Error ? usageError.stack : undefined,
      });
    }

    // Return summary
    return {
      id: result.id,
      tenantId,
      sourceId: params.sourceId,
      status: "completed",
      totalDelta: totalAmountSource - totalAmountTarget,
      currency: sourceTransactions[0]?.currency || "USD",
      mismatchCount: matchResult.unmatchedCount,
      startedAt: result.startedAt,
      completedAt: result.completedAt || undefined,
    };
  } catch (error) {
    await safeLogger.error("[runReconciliation] Unexpected error", {
      tenantId,
      sourceId: params.sourceId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return null;
  }
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
      orderBy: { createdAt: 'desc' },
    });
    
    // Get source transactions for matches
    const sourceTransactionIds = matches.map(m => m.sourceTransactionId);
    const sourceTransactions = (await prisma.normalizedTransaction.findMany({
      where: {
        id: { in: sourceTransactionIds },
        tenantId,
      },
    })) as Array<{
      id: string;
      amount: number;
      currency: string;
      date: string;
      description: string | null;
    }>;
    
    const sourceTransactionMap = new Map(sourceTransactions.map(t => [t.id, t]));

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

      const impact = calculateImpact(
        delta,
        sourceTransaction.currency,
        Number(match.confidence)
      );
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
        status: match.matchType === "exact" || match.matchType === "fuzzy" ? "matched" : "unmatched",
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
