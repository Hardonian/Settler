/**
 * Admin Analytics Studio
 *
 * Marked as runtime-degraded-without-env in route maturity registry.
 * Checks environment configuration before rendering analytics data.
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validateSupabaseEnv } from "@/lib/env/validator";
import { getUserRole, UserRole } from "@/shared/auth/roles";
import { AnalyticsStudio } from "@/components/console/AnalyticsStudio";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import { RouteStateCard, routeStateFromVariant } from "@/components/shared/route-state";
import { CardLoadingSkeleton } from "@/components/shared/loading-state";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { appLogger } from "@/lib/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function AnalyticsContent() {
  // Environment validation check - this route is marked as runtime-degraded-without-env
  const envValidation = validateSupabaseEnv();
  if (!envValidation.isValid) {
    appLogger.warn("Analytics page: Missing environment configuration", {
      route: "/console/analytics",
      missingVars: envValidation.missing,
    });
    return (
      <RouteStateCard
        {...routeStateFromVariant("env-missing", {
          detail:
            "Analytics Studio requires Supabase environment variables to be configured. Without these, event-derived rollups cannot be computed.",
        })}
      />
    );
  }

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
