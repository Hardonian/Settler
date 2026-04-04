/**
 * Operator Support Inbox
 *
 * Admin view of canonical support submissions from AuditLog.
 * Replaces legacy ops_support_tickets-backed inbox.
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRole, UserRole } from "@/shared/auth/roles";
import { OperatorSupportInbox } from "@/components/console/OperatorSupportInbox";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function SupportContent() {
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
      <div className="max-w-4xl mx-auto px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Access denied
            </CardTitle>
            <CardDescription>
              The support inbox is restricted to operators and administrators.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ConsolePageHeader
        title="Support inbox"
        description="Canonical view of all tenant support submissions. Triage, update status, and add operator notes."
      />
      <OperatorSupportInbox />
    </div>
  );
}

export default function SupportPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <ErrorBoundary componentName="SupportPage">
        <Suspense
          fallback={<div className="text-muted-foreground text-sm">Loading support inbox…</div>}
        >
          <SupportContent />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
