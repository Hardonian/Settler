/**
 * Ops Insights Page
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRole, UserRole } from "@/shared/auth/roles";
import { InsightsView } from "@/components/ops/InsightsView";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import { RouteStateCard, routeStateFromVariant } from "@/components/shared/route-state";
import { CardLoadingSkeleton } from "@/components/shared/loading-state";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { OpsIntelligenceErrorBoundary } from "@/components/ops/ErrorBoundary";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function InsightsContent() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/console");
  }

  const role = await getUserRole(user.id);
  const isAdmin = role === UserRole.SUPER_ADMIN;

  if (!isAdmin) {
    return (
      <RouteStateCard
        {...routeStateFromVariant("forbidden", {
          title: "Admin scope required",
          description: "Ops Insights is restricted to super-admin sessions.",
          detail:
            "This surface aggregates global operational signals and is intentionally unavailable in tenant scope.",
          className: "px-0 py-2",
        })}
      />
    );
  }

  return <InsightsView userId={user.id} />;
}

export default function InsightsPage() {
  return (
    <div className="space-y-6">
      <ConsolePageHeader
        title="Ops Insights"
        description="Global operational intelligence and recommendations for super-admin operators."
        scope="admin"
      />
      <ErrorBoundary componentName="InsightsPage">
        <OpsIntelligenceErrorBoundary>
          <Suspense fallback={<CardLoadingSkeleton count={3} />}>
            <InsightsContent />
          </Suspense>
        </OpsIntelligenceErrorBoundary>
      </ErrorBoundary>
    </div>
  );
}
