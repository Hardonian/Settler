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
 * Check if user has any organization membership (tenant context)
 * Returns the organization ID if found, null otherwise
 */
async function getUserOrganizationId(): Promise<string | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  // Query organization_members to check for any organization membership
  const { data: orgMember } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  // Define the expected shape since Supabase types may not include this table
  type OrgMemberRow = {
    organization_id?: string | null;
  };
  const orgMemberData = orgMember as OrgMemberRow | null;

  if (!orgMemberData?.organization_id) {
    return null;
  }

  return orgMemberData.organization_id;
}

export default async function AuditTrailPage() {
  // Check for tenant/organization context - this route requires tenant scope
  const organizationId = await getUserOrganizationId();

  if (!organizationId) {
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
            title: "Organization required",
            description:
              "Audit Trail is a tenant-scoped resource that requires an active organization context.",
            detail:
              "Create or join an organization to access tenant-scoped audit logs. Without an active organization, audit entries cannot be filtered or displayed.",
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
      <AdvancedAuditTrail />
    </div>
  );
}
