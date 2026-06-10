import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RouteStateCard, routeStateFromVariant } from "@/components/shared/route-state";

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

const surfaces = [
  {
    title: "Verification runs",
    description: "Execute deterministic verification checks and review route-level failures.",
    href: "/verify",
    cta: "Open verification",
  },
  {
    title: "Audit artifacts",
    description: "Review receipts, proof manifests, and exportable evidence for control reviews.",
    href: "/console/receipts",
    cta: "Open artifacts",
  },
  {
    title: "Month-End Lock (SOC2)",
    description: "Cryptographically lock ledgers and generate auditor-ready compliance reports.",
    href: "/console/audits/lock",
    cta: "Manage Ledger Locks",
  },
];

export default async function AuditsPage() {
  // Check for tenant/organization context - this route requires tenant scope
  const organizationId = await getUserOrganizationId();

  if (!organizationId) {
    return (
      <div className="space-y-6">
        <ConsolePageHeader
          title="Audits"
          description="Tenant-scoped evidence and verification workflows for compliance and operator review."
        />
        <RouteStateCard
          {...routeStateFromVariant("no-organization", {
            title: "Organization required",
            description:
              "Audits is a tenant-scoped feature that requires an active organization context.",
            detail:
              "Create or join an organization to access tenant-scoped audit evidence and verification workflows. Without an active organization, audit data cannot be filtered or displayed.",
          })}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConsolePageHeader
        title="Audits"
        description="Tenant-scoped evidence and verification workflows for compliance and operator review."
      />

      <section aria-label="Audit surfaces" className="grid gap-4 md:grid-cols-2">
        {surfaces.map((surface) => (
          <Card key={surface.href}>
            <CardHeader>
              <CardTitle>{surface.title}</CardTitle>
              <CardDescription>{surface.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href={surface.href}>{surface.cta}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
