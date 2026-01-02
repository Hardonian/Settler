/**
 * Reconciliation Service
 *
 * Runs reconciliation jobs and retrieves reconciliation summaries.
 */

import { createClient } from "@/lib/supabase/server";
import type {
  ReconciliationSummary,
  ReconciliationItem,
  TenantId,
  SourceId,
} from "@/lib/domain/types";
import { calculateImpact, generateExplanation } from "@/lib/judgment/rules";
import type { Database } from "@/types/database.types";

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
      console.warn("[runReconciliation] User not authenticated");
      return null;
    }

    // Set tenant context for RLS
    try {
      await (supabase.rpc as any)("set_tenant_context", { tenant_id: tenantId });
    } catch {
      // RPC might not exist, continue anyway
    }

    // Find or create recon_job
    type ReconJobRow = Database["public"]["Tables"]["recon_jobs"]["Row"];
    const { data: existingJob, error: findError } = (await supabase
      .from("recon_jobs")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("source_adapter", params.sourceId)
      .eq("status", "active")
      .maybeSingle()) as { data: ReconJobRow | null; error: any };

    if (findError && findError.code !== "PGRST116") {
      console.error("[runReconciliation] Error finding job:", findError);
    }

    const jobId = existingJob?.id;

    // Create recon_result
    type ReconResultRow = Database["public"]["Tables"]["recon_results"]["Row"];
    type ReconResultInsert = Database["public"]["Tables"]["recon_results"]["Insert"];
    const { data: result, error: createError } = (await (supabase.from("recon_results") as any)
      .insert({
        recon_job_id: jobId,
        tenant_id: tenantId,
        status: "running",
        started_at: new Date().toISOString(),
      } as ReconResultInsert)
      .select()
      .single()) as { data: ReconResultRow | null; error: any };

    if (createError || !result) {
      console.error("[runReconciliation] Error creating result:", createError);
      return null;
    }

    // Get transactions for matching
    // For 10% scope: match transactions from ingestion source against receipts
    const { prisma } = await import("@/shared/db/prismaClient");
    
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

    // Update reconciliation run with results
    const totalAmountSource = sourceTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalAmountTarget = targetTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    const matchedAmount = matchResult.matches
      .filter(m => m.matchType !== 'unmatched')
      .reduce((sum, m) => {
        const sourceTx = sourceTransactions.find(t => t.id === m.sourceTransactionId);
        return sum + (sourceTx ? Number(sourceTx.amount) : 0);
      }, 0);

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
        totalAmountSource,
        totalAmountTarget,
        totalAmountMatched: matchedAmount,
        totalAmountUnmatched: totalAmountSource - matchedAmount,
        currency: sourceTransactions[0]?.currency || 'USD',
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
      console.error("[runReconciliation] Usage tracking failed:", usageError);
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
      startedAt: new Date(result.started_at),
    };
  } catch (error) {
    console.error("[runReconciliation] Unexpected error:", error);
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
      console.warn("[getReconciliationSummary] User not authenticated");
      return null;
    }

    // Set tenant context for RLS
    try {
      await (supabase.rpc as any)("set_tenant_context", { tenant_id: tenantId });
    } catch {
      // RPC might not exist, continue anyway
    }

    type ReconResultRow = Database["public"]["Tables"]["recon_results"]["Row"];
    const { data: result, error } = (await supabase
      .from("recon_results")
      .select("*")
      .eq("id", reconciliationId)
      .eq("tenant_id", tenantId)
      .single()) as { data: ReconResultRow | null; error: any };

    if (error || !result) {
      console.error("[getReconciliationSummary] Error:", error);
      return null;
    }

    return {
      id: result.id,
      tenantId,
      sourceId: result.recon_job_id ?? "unknown",
      status: result.status as "running" | "completed" | "failed",
      totalDelta: result.total_amount_unmatched ? Number(result.total_amount_unmatched) : 0,
      currency: result.currency ?? "USD",
      mismatchCount: result.unmatched_source_count ?? 0,
      startedAt: new Date(result.started_at),
      completedAt: result.completed_at ? new Date(result.completed_at) : undefined,
    };
  } catch (error) {
    console.error("[getReconciliationSummary] Unexpected error:", error);
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
      console.warn("[listReconciliationItems] User not authenticated");
      return [];
    }

    // Set tenant context for RLS
    try {
      await (supabase.rpc as any)("set_tenant_context", { tenant_id: tenantId });
    } catch {
      // RPC might not exist, continue anyway
    }

    // Query reconciliation graph nodes for items
    // Note: reconciliation_graph_nodes table not yet defined in Database types
    const { data: nodes, error } = (await (supabase.from("reconciliation_graph_nodes") as any)
      .select("*")
      .eq("job_id", reconciliationId)
      .order("created_at", { ascending: false })) as { data: any[] | null; error: any };

    if (error) {
      console.error("[listReconciliationItems] Error:", error);
      return [];
    }

    // Transform nodes to ReconciliationItem objects
    const items: ReconciliationItem[] = [];

    for (const node of nodes ?? []) {
      const data = node.data as Record<string, unknown>;
      const sourceAmount = typeof data.sourceAmount === "number" ? data.sourceAmount : 0;
      const targetAmount = typeof data.targetAmount === "number" ? data.targetAmount : 0;
      const delta = sourceAmount - targetAmount;

      const impact = calculateImpact(
        delta,
        node.currency ?? "USD",
        node.confidence ? Number(node.confidence) : 0.75
      );
      const explanation = generateExplanation(
        {
          type: "reconciliation_item",
          sourceId: node.source_id ?? "unknown",
          timestamp: new Date(node.timestamp),
          rawData: data,
        },
        delta
      );

      items.push({
        id: node.id,
        reconciliationId,
        sourceId: node.source_id ?? "unknown",
        sourceAmount,
        sourceCurrency: node.currency ?? "USD",
        targetAmount,
        targetCurrency: node.currency ?? "USD",
        delta,
        status:
          node.node_type === "match"
            ? "matched"
            : node.node_type === "unmatched"
              ? "unmatched"
              : "conflict",
        impact,
        explanation,
        urgency: impact.riskScore > 0.7 ? "high" : impact.riskScore > 0.5 ? "medium" : "low",
        createdAt: new Date(node.created_at),
      });
    }

    // Sort by impact (risk score descending)
    items.sort((a, b) => b.impact.riskScore - a.impact.riskScore);

    return items;
  } catch (error) {
    console.error("[listReconciliationItems] Unexpected error:", error);
    return [];
  }
}
