import Link from "next/link";
import { AlertTriangle, CheckCircle2, Database, Wrench } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { getConsoleActivationOverview } from "@/lib/server/console/activation-overview";
import { getActivationHeadline, getActivationSummary } from "@/lib/activation/overview";
import { readinessStateToBadgeStatus, summarizeReadinessCounts } from "@/lib/activation/readiness";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function SetupCheckPage() {
  const overview = await getConsoleActivationOverview();
  const allChecks = [...overview.systemChecks, ...overview.journeyChecks];
  const counts = summarizeReadinessCounts(allChecks);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Wrench className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-[0.24em]">
              Console Diagnostics
            </span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">{getActivationHeadline(overview)}</h1>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {getActivationSummary(overview)}
          </p>
        </div>
        <StatusBadge
          status={readinessStateToBadgeStatus(overview.overallState)}
          label={overview.overallState.replace(/_/g, " ")}
        />
      </div>

      <Card className="border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/20">
        <CardContent className="flex gap-3 pt-6">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-700 dark:text-amber-400" />
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-amber-900 dark:text-amber-200">
              Settler reports degraded and blocked states explicitly
            </p>
            <p className="text-amber-800/90 dark:text-amber-300/90">
              Treat every `setup required`, `degraded`, or `unavailable` result below as real
              operator truth. These are recovery paths, not empty-state success.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <DiagnosticCountCard label="Ready" count={counts.ready} tone="ready" />
        <DiagnosticCountCard label="Degraded" count={counts.degraded} tone="degraded" />
        <DiagnosticCountCard
          label="Setup Required"
          count={counts.setup_required}
          tone="setup_required"
        />
        <DiagnosticCountCard label="Unavailable" count={counts.unavailable} tone="unavailable" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <DiagnosticSection
          title="Runtime and System Checks"
          description="Foundational configuration required before tenant-scoped console truth can be trusted."
          icon={Database}
          checks={overview.systemChecks}
        />
        <DiagnosticSection
          title="Operator Journey Checks"
          description="First-customer readiness from workspace setup through proof export."
          icon={CheckCircle2}
          checks={overview.journeyChecks}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Next Highest-Leverage Actions</CardTitle>
          <CardDescription>
            Work these in order to reduce founder dependency and reach first-customer proof faster.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {overview.tasks.map((task) => (
            <div key={task.id} className="rounded-lg border border-border/60 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{task.label}</p>
                    <StatusBadge
                      status={
                        task.state === "completed"
                          ? "completed"
                          : task.state === "current"
                            ? "warning"
                            : "error"
                      }
                      label={task.state.replace(/_/g, " ")}
                      size="sm"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                </div>
                <Button asChild variant={task.state === "completed" ? "outline" : "default"}>
                  <Link href={task.href}>{task.actionLabel}</Link>
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/console">Back to Console</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/console/onboarding">Open Onboarding</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/console/proof-explorer">Open Proof Explorer</Link>
        </Button>
      </div>
    </div>
  );
}

function DiagnosticSection({
  title,
  description,
  icon: Icon,
  checks,
}: {
  title: string;
  description: string;
  icon: typeof Database;
  checks: Awaited<ReturnType<typeof getConsoleActivationOverview>>["systemChecks"];
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {checks.map((check) => (
          <div key={check.id} className="rounded-lg border border-border/60 p-4 space-y-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <p className="font-medium">{check.label}</p>
                <p className="text-sm text-muted-foreground">{check.summary}</p>
              </div>
              <StatusBadge
                status={readinessStateToBadgeStatus(check.state)}
                label={check.state.replace(/_/g, " ")}
                size="sm"
              />
            </div>
            <p className="text-sm text-muted-foreground">{check.detail}</p>
            {check.href && check.actionLabel ? (
              <Button asChild size="sm" variant="outline">
                <Link href={check.href}>{check.actionLabel}</Link>
              </Button>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DiagnosticCountCard({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: "ready" | "degraded" | "setup_required" | "unavailable";
}) {
  const accentClass =
    tone === "ready"
      ? "text-green-600"
      : tone === "degraded"
        ? "text-amber-600"
        : tone === "setup_required"
          ? "text-orange-600"
          : "text-red-600";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardDescription>{label}</CardDescription>
        <CardTitle className={`text-3xl ${accentClass}`}>{count}</CardTitle>
      </CardHeader>
    </Card>
  );
}
