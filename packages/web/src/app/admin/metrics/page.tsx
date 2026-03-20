/**
 * Admin Metrics Dashboard Page
 *
 * Executive dashboard for viewing key business metrics.
 */

import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ExecutiveDashboard } from "@/components/console/ExecutiveDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { adminLogger } from "@/lib/admin/utils/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function AdminMetricsContent() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Please sign in to access the admin dashboard.
          </p>
        </div>
      );
    }

    // Use proper super admin check
    const { isSuperAdmin } = await import("@/lib/auth/super-admin");
    const isAdmin = await isSuperAdmin();

    if (!isAdmin) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            You do not have permission to access this page.
          </p>
        </div>
      );
    }
  } catch (error) {
    adminLogger.error("Error in admin metrics page", error);
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-red-800 dark:text-red-200 mb-2">Unable to load metrics dashboard.</p>
          <p className="text-sm text-red-600 dark:text-red-400">
            Please try again or contact support if the problem persists.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Executive Dashboard
        </h1>
        <p className="text-muted-foreground">Key business metrics and KPIs</p>
      </div>

      <ExecutiveDashboard />
    </div>
  );
}

export default function AdminMetricsPage() {
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-background via-blue-50 to-indigo-50 dark:from-background dark:via-card dark:to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Suspense
            fallback={
              <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-96 w-full" />
              </div>
            }
          >
            {/* @ts-ignore */}
            <AdminMetricsContent />
          </Suspense>
        </div>
      </div>
      <Footer />
    </>
  );
}
