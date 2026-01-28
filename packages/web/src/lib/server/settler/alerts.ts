/**
 * Alerts Service
 *
 * Manages intelligent alerts with explanations and threshold tracking.
 */

import { createClient } from "@/lib/supabase/server";
import type { Alert, TenantId } from "@/lib/domain/types";
import { generateExplanation } from "@/lib/judgment/rules";
import type { Database } from "@/types/database.types";
import { safeLogger } from "@/lib/observability/safe-logger";

/**
 * List alerts for a tenant
 */
export async function listAlerts(
  tenantId: TenantId,
  includeAcknowledged: boolean = false
): Promise<Alert[]> {
  try {
    const supabase = await createClient();

    // Verify tenant access
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      await safeLogger.warn("[listAlerts] User not authenticated", { tenantId });
      return [];
    }

    // Set tenant context for RLS
    try {
      await (supabase.rpc as any)("set_tenant_context", { tenant_id: tenantId });
    } catch (error) {
      // RPC might not exist, continue anyway
    }

    type AlertRow = Database["public"]["Tables"]["alerts"]["Row"];
    let query = supabase
      .from("alerts")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (!includeAcknowledged) {
      query = query.eq("acknowledged", false);
    }

    const { data: alerts, error } = (await query) as { data: AlertRow[] | null; error: any };

    if (error) {
      await safeLogger.error("[listAlerts] Error", {
        tenantId,
        error: error.message || String(error),
      });
      return [];
    }

    return (alerts ?? []).map((a) => ({
      id: a.id,
      tenantId: a.tenant_id,
      severity: a.severity as "info" | "warning" | "critical",
      title: a.title,
      message: a.message,
      explanation: generateExplanation({
        type: "alert",
        sourceId: a.source_id ?? "unknown",
        timestamp: new Date(a.created_at),
        rawData: {
          alertType: a.alert_type,
          threshold: a.threshold_value,
          actual: a.actual_value,
        },
      }),
      threshold:
        a.threshold_value && a.actual_value
          ? {
              type: a.alert_type ?? "unknown",
              value: Number(a.threshold_value),
              actual: Number(a.actual_value),
            }
          : undefined,
      acknowledged: a.acknowledged ?? false,
      acknowledgedBy: a.acknowledged_by ?? undefined,
      acknowledgedAt: a.acknowledged_at ? new Date(a.acknowledged_at) : undefined,
      createdAt: new Date(a.created_at),
    }));
  } catch (error) {
    await safeLogger.error("[listAlerts] Unexpected error", {
      tenantId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return [];
  }
}

/**
 * Acknowledge an alert
 */
export async function acknowledgeAlert(tenantId: TenantId, alertId: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    // Verify tenant access
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      await safeLogger.warn("[acknowledgeAlert] User not authenticated", { tenantId, alertId });
      return false;
    }

    // Set tenant context for RLS
    try {
      await (supabase.rpc as any)("set_tenant_context", { tenant_id: tenantId });
    } catch (error) {
      // RPC might not exist, continue anyway
    }

    type AlertUpdate = Database["public"]["Tables"]["alerts"]["Update"];
    const { error } = await (supabase.from("alerts") as any)
      .update({
        acknowledged: true,
        acknowledged_by: user.id,
        acknowledged_at: new Date().toISOString(),
      } as AlertUpdate)
      .eq("id", alertId)
      .eq("tenant_id", tenantId);

    if (error) {
      await safeLogger.error("[acknowledgeAlert] Error", {
        tenantId,
        alertId,
        error: error.message || String(error),
      });
      return false;
    }

    return true;
  } catch (error) {
    await safeLogger.error("[acknowledgeAlert] Unexpected error", {
      tenantId,
      alertId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return false;
  }
}
