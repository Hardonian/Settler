/**
 * Audit Trail Page
 *
 * Marked as runtime-degraded-without-tenant in route maturity registry.
 * Checks for tenant/organization context before rendering audit logs.
 */

import { createClient } from "@/lib/supabase/server";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import { AdvancedAuditTrail } from "@/components/console/AdvancedAuditTrail";
import { RouteStateCard, routeStateFromVariant } from "@/components/shared/route-state";
import { appLogger } from "@/lib/utils/logger";

/**
 * Check if user has any tenant membership (tenant context)
 * Returns the tenant ID if found, null otherwise
 *
 * SECURITY: This aligns with the API's tenant filtering approach.
 * The API uses tenant_id for filtering, so the web layer must also use tenant context.
 * We query tenant_users (or users table with tenant_id) for consistent tenant resolution.
 */
async function getUserTenantId(): Promise<string | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  // Query users table to get tenant_id - aligns with API tenant resolution
  // This is consistent with packages/api/src/middleware/tenant.ts
  // which also queries users.tenant_id
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .limit(1)
    .single();

  if (userError || !userData?.tenant_id) {
    return null;
  }

  return userData.tenant_id;
}

export default async function AuditTrailPage() {
  // Check for tenant context - this route requires tenant scope
  // SECURITY: Using tenant_id to align with API filtering (tenant_id in audit_logs)
  const tenantId = await getUserTenantId();

  if (!tenantId) {
    appLogger.warn("Audit Trail page: No tenant context available", {
      route: "/console/audit-trail",
    });
    return (
      <div className="space-y-6">
        <ConsolePageHeader
          title="Audit Trail"
          description="Tenant-scoped audit logs for operational actions, policy events, and evidence exports."
        />
        <RouteStateCard
          {...routeStateFromVariant("no-organization", {
            title: "Tenant required",
            description:
              "Audit Trail is a tenant-scoped resource that requires an active tenant context.",
            detail:
              "Create or join a tenant to access tenant-scoped audit logs. Without an active tenant, audit entries cannot be filtered or displayed.",
          })}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConsolePageHeader
        title="Audit Trail"
        description="Tenant-scoped audit logs for operational actions, policy events, and evidence exports."
      />
      <AdvancedAuditTrail tenantId={tenantId} />
    </div>
  );
}
