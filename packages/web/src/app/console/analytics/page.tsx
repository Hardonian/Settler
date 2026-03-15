/**
 * Admin Analytics Studio
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRole, UserRole } from "@/shared/auth/roles";
import { AnalyticsStudio } from "@/components/console/AnalyticsStudio";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import { RouteStateCard, routeStateFromVariant } from "@/components/shared/route-state";
import { CardLoadingSkeleton } from "@/components/shared/loading-state";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function AnalyticsContent() {
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
          description: "Analytics Studio is restricted to super-admin sessions.",
          detail:
            "This route exposes global analytics and is intentionally unavailable to tenant-scoped operators.",
          className: "px-0 py-2",
        })}
      />
    );
  }

  return <AnalyticsStudio userId={user.id} />;
}

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <ConsolePageHeader
        title="Analytics Studio"
        description="Global analytics for super-admin operators across tenants and runtime domains."
        scope="admin"
      />
      <ErrorBoundary componentName="AnalyticsPage">
        <Suspense fallback={<CardLoadingSkeleton count={3} />}>
          <AnalyticsContent />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
