/**
 * Feature Flags Service
 *
 * Manages feature flags as business policy controls.
 */

import { createClient } from "@/lib/supabase/server";
import type { FlagKey, FlagValue, TenantId } from "@/lib/domain/types";
import { FLAG_REGISTRY } from "@/lib/flags/registry";
import type { Database } from "@/types/database.types";
import { safeLogger } from "@/lib/observability/safe-logger";

/**
 * Get feature flags for a tenant
 */
export async function getFeatureFlags(tenantId: TenantId): Promise<FlagValue[]> {
  try {
    const supabase = await createClient();

    // Verify tenant access
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      await safeLogger.warn("[getFeatureFlags] User not authenticated", { tenantId });
      return [];
    }

    // Set tenant context for RLS
    try {
      await (supabase.rpc as any)("set_tenant_context", { tenant_id: tenantId });
    } catch {
      // RPC might not exist, continue anyway
    }

    type FeatureFlagRow = Database["public"]["Tables"]["feature_flags"]["Row"];
    const { data: flags, error } = (await supabase
      .from("feature_flags")
      .select("*")
      .eq("tenant_id", tenantId)) as { data: FeatureFlagRow[] | null; error: any };

    if (error) {
      await safeLogger.error("[getFeatureFlags] Error", {
        tenantId,
        error: error.message || String(error),
      });
      // Return defaults from registry
      return Object.values(FLAG_REGISTRY)
        .filter((flag: any) => flag.scope === "tenant")
        .map((flag) => ({
          key: flag.key,
          value: flag.default,
          tenantId,
          updatedAt: new Date(),
        }));
    }

    // Merge with registry defaults
    const flagMap = new Map<string, FlagValue>();

    // Add defaults
    for (const flag of Object.values(FLAG_REGISTRY)) {
      if (flag.scope === "tenant" || flag.scope === "global") {
        flagMap.set(flag.key, {
          key: flag.key,
          value: flag.default,
          tenantId,
          updatedAt: new Date(),
        });
      }
    }

    // Override with tenant-specific values
    for (const flag of flags ?? []) {
      if (flag.is_enabled && flag.value) {
        flagMap.set(flag.flag_key, {
          key: flag.flag_key,
          value: flag.value as boolean | number | string | Record<string, unknown>,
          tenantId,
          updatedAt: new Date(flag.updated_at),
        });
      }
    }

    return Array.from(flagMap.values());
  } catch (error) {
    await safeLogger.error("[getFeatureFlags] Unexpected error", {
      tenantId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    // Return defaults on error
    return Object.values(FLAG_REGISTRY)
      .filter((flag: any) => flag.scope === "tenant")
      .map((flag) => ({
        key: flag.key,
        value: flag.default,
        tenantId,
        updatedAt: new Date(),
      }));
  }
}

/**
 * Set a feature flag value
 */
export async function setFeatureFlag(
  tenantId: TenantId,
  key: FlagKey,
  value: boolean | number | string | Record<string, unknown>
): Promise<boolean> {
  try {
    const supabase = await createClient();

    // Verify tenant access
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      await safeLogger.warn("[setFeatureFlag] User not authenticated", { tenantId, key });
      return false;
    }

    // Validate flag exists in registry
    const flagDef = FLAG_REGISTRY[key];
    if (!flagDef) {
      await safeLogger.warn("[setFeatureFlag] Unknown flag key", { tenantId, key });
      return false;
    }

    // Validate value type
    if (typeof value !== flagDef.type && flagDef.type !== "json") {
      await safeLogger.warn("[setFeatureFlag] Value type mismatch", {
        tenantId,
        key,
        expectedType: flagDef.type,
        actualType: typeof value,
      });
      return false;
    }

    // Validate value constraints
    if (flagDef.validation) {
      if (typeof value === "number") {
        if (flagDef.validation.min !== undefined && value < flagDef.validation.min) {
          return false;
        }
        if (flagDef.validation.max !== undefined && value > flagDef.validation.max) {
          return false;
        }
      }
      if (flagDef.validation.enum && !flagDef.validation.enum.includes(value as string | number)) {
        return false;
      }
    }

    // Set tenant context for RLS
    try {
      await (supabase.rpc as any)("set_tenant_context", { tenant_id: tenantId });
    } catch {
      // RPC might not exist, continue anyway
    }

    // Upsert flag
    const { error } = await (supabase.from("feature_flags") as any).upsert(
      {
        tenant_id: tenantId,
        flag_key: key,
        value: typeof value === "object" ? value : value,
        is_enabled: true,
      },
      {
        onConflict: "tenant_id,flag_key",
      }
    );

    if (error) {
      await safeLogger.error("[setFeatureFlag] Error", {
        tenantId,
        key,
        error: error.message || String(error),
      });
      return false;
    }

    return true;
  } catch (error) {
    await safeLogger.error("[setFeatureFlag] Unexpected error", {
      tenantId,
      key,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return false;
  }
}
