/**
 * Tenant Observability Dashboard
 *
 * Super-admin page for global tenant observability with redacted data.
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import { TenantsObservabilityDashboard } from "@/components/console/TenantsObservabilityDashboard";
import { RouteStateCard, routeStateFromVariant } from "@/components/shared/route-state";
import { CardLoadingSkeleton } from "@/components/shared/loading-state";
import { createClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function TenantsObservabilityContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signup?next=/console/admin/tenants");
  }

  const hasAdminScope = await isSuperAdmin();
  if (!hasAdminScope) {
    return (
      <RouteStateCard
        {...routeStateFromVariant("forbidden", {
          title: "Admin scope required",
          description: "Tenant observability is restricted to super-admin sessions.",
          detail:
            "This route exposes global tenant-level metadata and is intentionally blocked for tenant-scoped users.",
          className: "px-0 py-2",
        })}
      />
    );
  }

  return <TenantsObservabilityDashboard />;
}

export default function TenantsObservabilityPage() {
  return (
    <div className="space-y-6">
      <ConsolePageHeader
        title="Tenant Observability"
        description="Global tenant health and usage visibility for super-admin operators. PII remains redacted."
        scope="admin"
      />
      <Suspense fallback={<CardLoadingSkeleton count={3} />}>
        <TenantsObservabilityContent />
      </Suspense>
    </div>
  );
}
