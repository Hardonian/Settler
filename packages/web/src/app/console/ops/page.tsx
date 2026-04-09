/**
 * Founder Ops Command Center
 *
 * Admin-only dashboard for operational monitoring and management.
 * Tabs: Overview, Customers, Usage, Jobs/Queues, Webhooks, Errors, Billing, Exports, Runbooks
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRole, UserRole } from "@/shared/auth/roles";
import { OpsDashboard } from "@/components/ops/OpsDashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function OpsContent() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/console");
  }

  // Check if user is admin
  const role = await getUserRole(user.id);
  const isAdmin = role === UserRole.SUPER_ADMIN;

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Access Denied
            </CardTitle>
            <CardDescription>This page is restricted to administrators only.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You need super admin privileges to access the Ops Command Center.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <OpsDashboard userId={user.id} />;
}

export default function OpsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Ops Command Center</h1>
        <p className="text-muted-foreground mt-2">
          Operational monitoring and management dashboard
        </p>
      </div>
      <ErrorBoundary componentName="OpsPage">
        <Suspense fallback={<div>Loading...</div>}>
          <OpsContent />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
