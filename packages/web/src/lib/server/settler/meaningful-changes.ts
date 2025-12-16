/**
 * Meaningful Changes Service
 *
 * Lists changes with impact ranking and explanations.
 */

import { createClient } from "@/lib/supabase/server";
import type { MeaningfulChange, TenantId } from "@/lib/domain/types";
import {
  generateExplanation,
  calculateImpact,
  calculateUrgency,
  getSourceReliabilityScore,
} from "@/lib/judgment/rules";
import type { Database } from "@/types/database.types";

export interface MeaningfulChangesFilters {
  severity?: "info" | "warning" | "critical";
  minRiskScore?: number;
  sourceId?: string;
  limit?: number;
  offset?: number;
}

/**
 * List meaningful changes for a tenant
 * Returns changes ranked by: criticality, impact, urgency, confidence
 */
export async function listMeaningfulChanges(
  tenantId: TenantId,
  filters: MeaningfulChangesFilters = {}
): Promise<MeaningfulChange[]> {
  try {
    const supabase = await createClient();

    // Verify tenant access
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.warn("[listMeaningfulChanges] User not authenticated");
      return [];
    }

    // Set tenant context for RLS
    try {
      await (supabase.rpc as any)("set_tenant_context", { tenant_id: tenantId });
    } catch {
      // RPC might not exist, continue anyway
    }

    // Query events (from recon_results, drift_events, or a unified events table)
    // For now, we'll query recon_results and drift_events
    const limit = Math.min(filters.limit ?? 50, 100);
    const offset = filters.offset ?? 0;

    type ReconResultRow = Database["public"]["Tables"]["recon_results"]["Row"];
    type MeaningfulChangeRow = Database["public"]["Tables"]["meaningful_changes"]["Row"];

    // Query reconciliation results as events
    const { data: reconResults, error: reconError } = (await supabase
      .from("recon_results")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("started_at", { ascending: false })
      .range(offset, offset + limit - 1)) as { data: ReconResultRow[] | null; error: any };

    if (reconError) {
      console.error("[listMeaningfulChanges] Error querying recon_results:", reconError);
    }

    // Query drift events (using meaningful_changes table)
    const { data: driftEvents, error: driftError } = (await supabase
      .from("meaningful_changes")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)) as { data: MeaningfulChangeRow[] | null; error: any };

    if (driftError) {
      console.error("[listMeaningfulChanges] Error querying drift_events:", driftError);
    }

    // Transform to MeaningfulChange objects
    const changes: MeaningfulChange[] = [];

    // Process reconciliation results
    if (reconResults) {
      for (const result of reconResults) {
        const delta = result.total_amount_unmatched
          ? Number(result.total_amount_unmatched)
          : undefined;

        const sourceReliability = getSourceReliabilityScore(result.recon_job_id ?? "unknown");
        const explanation = generateExplanation(
          {
            type: "reconciliation",
            sourceId: result.recon_job_id ?? "unknown",
            timestamp: new Date(result.started_at),
            rawData: result.summary ?? {},
          },
          delta
        );

        const impact = calculateImpact(delta, result.currency ?? "USD", sourceReliability);
        const urgency = calculateUrgency(impact, explanation);

        // Apply filters
        if (filters.minRiskScore && impact.riskScore < filters.minRiskScore) continue;
        if (filters.sourceId && result.recon_job_id !== filters.sourceId) continue;

        changes.push({
          id: result.id,
          event: {
            type: "reconciliation",
            sourceId: result.recon_job_id ?? "unknown",
            timestamp: new Date(result.started_at),
            rawData: result.summary ?? {},
          },
          explanation,
          impact,
          urgency,
          confidence: impact.confidence,
          createdAt: new Date(result.started_at),
        });
      }
    }

    // Process drift events
    if (driftEvents) {
      for (const event of driftEvents) {
        const sourceReliability = getSourceReliabilityScore(event.recon_job_id ?? "unknown");
        const explanation = generateExplanation({
          type: "drift",
          sourceId: event.recon_job_id ?? "unknown",
          timestamp: new Date(event.created_at),
          rawData: {
            driftType: event.drift_type,
            severity: event.severity,
            fieldPath: event.field_path,
          },
        });

        const impact = calculateImpact(undefined, "USD", sourceReliability);
        const urgency = calculateUrgency(impact, explanation);

        // Map severity
        const severityMap: Record<string, "low" | "medium" | "high" | "critical"> = {
          warning: "medium",
          error: "high",
          critical: "critical",
        };
        const mappedUrgency = severityMap[event.severity] ?? urgency;

        // Apply filters
        if (filters.severity && event.severity !== filters.severity) continue;

        changes.push({
          id: event.id,
          event: {
            type: "drift",
            sourceId: event.recon_job_id ?? "unknown",
            timestamp: new Date(event.created_at),
            rawData: {
              driftType: event.drift_type,
              severity: event.severity,
            },
          },
          explanation,
          impact,
          urgency: mappedUrgency,
          confidence: impact.confidence,
          createdAt: new Date(event.created_at),
        });
      }
    }

    // Sort by: criticality (urgency), impact (risk score), confidence
    changes.sort((a, b) => {
      const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;

      const riskDiff = b.impact.riskScore - a.impact.riskScore;
      if (riskDiff !== 0) return riskDiff;

      return b.confidence - a.confidence;
    });

    return changes.slice(0, limit);
  } catch (error) {
    console.error("[listMeaningfulChanges] Unexpected error:", error);
    return [];
  }
}
