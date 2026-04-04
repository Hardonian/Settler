/**
 * Tenant-scoped operator support intake (evidence-aligned categories, optional run link).
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SupportWidget } from "@/components/console/SupportWidget";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function ReportIssueContent() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/console");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <ConsolePageHeader
        title="Report an issue"
        description={
          <>
            Opens a tenant-scoped support intake. When you include a run identifier, Settler attaches
            compact proof summary context for triage—not narrative “AI” conclusions.
          </>
        }
      />
      <Alert>
        <Info className="h-4 w-4" aria-hidden="true" />
        <AlertTitle>What happens next</AlertTitle>
        <AlertDescription>
          Your submission is written to the audit trail and operator runtime signals. You receive a
          submission reference to share with your team or Settler support. Response SLAs depend on your
          plan.
        </AlertDescription>
      </Alert>
      <SupportWidget defaultRoute="/console/report-issue" />
    </div>
  );
}

export default function ReportIssuePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <ErrorBoundary componentName="ReportIssuePage">
        <Suspense fallback={<div className="text-muted-foreground text-sm">Loading…</div>}>
          <ReportIssueContent />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
