"use client";

import React from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Database,
  FileCheck2,
  Layers,
  ListChecks,
  PlugZap,
  ShieldCheck,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useWorkbenchRealtime } from "@/hooks/use-workbench-realtime";
import { useConsoleActivationOverview } from "@/hooks/use-console-activation-overview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  formatActivationTimestamp,
  getActivationHeadline,
  getActivationSummary,
} from "@/lib/activation/overview";
import { readinessStateToBadgeStatus } from "@/lib/activation/readiness";

function ArrowRightIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function WorkbenchSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-[360px] lg:col-span-2" />
        <Skeleton className="h-[360px]" />
      </div>
    </div>
  );
}

export function Workbench() {
  const { data, isConnected, error } = useWorkbenchRealtime();
  const activation = useConsoleActivationOverview({ refreshIntervalMs: 30000 });

  if (!data && !error && activation.loading) {
    return <WorkbenchSkeleton />;
  }

  const { stats, activeRuns } = data || {
    stats: {
      open_exceptions: 0,
      high_severity_exceptions: 0,
      active_runs: 0,
      last_run_timestamp: null,
    },
    activeRuns: [],
  };

  const overview = activation.data;
  const headline = overview ? getActivationHeadline(overview) : "Loading activation truth";
  const summary = overview ? getActivationSummary(overview) : "Loading readiness checks.";

  const isNewWorkspace =
    overview && overview.counts.reconciliationRuns === 0 && overview.overallState !== "ready";

  return (
    <div className="space-y-8 pb-12">
      {isNewWorkspace ? (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                Activation: Reconciliation Engine Idle
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                Connect your financial sources and witness the power of deterministic matching.
                Follow the pilot guide to trigger your first run and generate your initial
                audit-grade proofpack.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Button asChild size="sm">
                <Link href="/docs/pilot">
                  Pilot guide <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/console/onboarding">Start onboarding</Link>
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-4xl space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/80">
              Settler Command Center
            </p>
            {overview ? (
              <StatusBadge
                status={readinessStateToBadgeStatus(overview.overallState)}
                label={headline}
              />
            ) : (
              <Badge
                variant="outline"
                className="h-5 text-[9px] bg-muted/20 text-muted-foreground gap-1"
              >
                <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                Loading activation
              </Badge>
            )}
            {isConnected ? (
              <Badge
                variant="outline"
                className="h-5 text-[9px] bg-success/5 border-success/20 text-success gap-1"
              >
                <div className="h-1 w-1 rounded-full bg-success animate-pulse" />
                Live runs
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="h-5 text-[9px] bg-muted/20 text-muted-foreground gap-1"
              >
                <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                Live updates disconnected
              </Badge>
            )}
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
              Operator Workbench
            </h1>
            <p className="mt-4 text-base text-muted-foreground font-medium leading-relaxed max-w-3xl">
              {summary}
            </p>
          </div>
        </div>

        {(error || activation.error) && (
          <div className="flex items-center gap-2 px-4 py-2 bg-warning/5 border border-warning/20 rounded-xl text-warning text-xs font-bold">
            <AlertTriangle size={14} />
            {activation.error || error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Open Exceptions"
          value={stats.open_exceptions}
          tone={stats.open_exceptions > 50 ? "warning" : "default"}
          icon={Layers}
          description="Total active exceptions needing review"
          href="/console/exceptions"
          linkLabel="Review Queue"
        />
        <StatCard
          label="High Urgency"
          value={stats.high_severity_exceptions}
          tone={stats.high_severity_exceptions > 0 ? "danger" : "success"}
          icon={Zap}
          description="Exceptions with 'High' or 'Critical' severity"
          href="/console/exceptions?severity=high,critical"
          linkLabel="Triaged Items"
        />
        <StatCard
          label="Active Runs"
          value={stats.active_runs}
          tone={stats.active_runs > 0 ? "info" : "default"}
          icon={Activity}
          description="Reconciliation jobs currently processing"
          href="/console/runs"
        />
        <StatCard
          label="Last Verified"
          value={
            stats.last_run_timestamp
              ? new Date(stats.last_run_timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "---"
          }
          tone="default"
          icon={CheckCircle2}
          description="Most recent completed reconciliation cycle"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/40 shadow-sm overflow-hidden border-l-4 border-l-primary/60">
            <CardHeader className="bg-primary/5 pb-4 border-b border-border/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-bold uppercase tracking-widest">
                    Live Reconciliation Runs
                  </CardTitle>
                </div>
                <Link href="/console/runs">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[10px] uppercase font-bold tracking-widest h-8"
                  >
                    View Run History <ArrowRightIcon className="ml-2 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {activeRuns.length > 0 ? (
                <div className="divide-y divide-border/20">
                  {activeRuns.map((run) => (
                    <div key={run.id} className="p-6 hover:bg-muted/30 transition-colors group">
                      <div className="flex items-center justify-between mb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black font-mono tracking-tighter">
                              RUN-{run.id.slice(0, 8).toUpperCase()}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[9px] uppercase font-black bg-primary/5 text-primary border-primary/20"
                            >
                              {run.status}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                            Job ID: {run.recon_job_id.slice(0, 12)}...
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-xs font-bold text-foreground">{run.progress}%</p>
                          <p className="text-[9px] text-muted-foreground uppercase font-medium">
                            Progress
                          </p>
                        </div>
                      </div>
                      <Progress value={run.progress} className="h-1.5 mb-4" />
                      <div className="grid grid-cols-3 gap-4">
                        <div className="px-3 py-2 rounded-lg bg-muted/40 border border-border/50">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
                            Matched
                          </p>
                          <p className="text-sm font-mono font-bold text-success">
                            {run.matched_count.toLocaleString()}
                          </p>
                        </div>
                        <div className="px-3 py-2 rounded-lg bg-muted/40 border border-border/50">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
                            Source Δ
                          </p>
                          <p className="text-sm font-mono font-bold text-warning">
                            {run.unmatched_source_count.toLocaleString()}
                          </p>
                        </div>
                        <div className="px-3 py-2 rounded-lg bg-muted/40 border border-border/50">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
                            Target Δ
                          </p>
                          <p className="text-sm font-mono font-bold text-danger">
                            {run.unmatched_target_count.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="h-12 w-12 rounded-2xl bg-muted/20 flex items-center justify-center border border-dashed border-border">
                      <Clock className="h-6 w-6 text-muted-foreground opacity-40 shrink-0" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-foreground">
                      No active reconciliation runs
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                      The engine is idle. Use the activation steps at right to reach first value.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-primary" />
                  Activation Checks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {overview ? (
                  overview.journeyChecks.map((check) => (
                    <div
                      key={check.id}
                      className="rounded-lg border border-border/60 p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{check.label}</p>
                          <p className="text-xs text-muted-foreground">{check.summary}</p>
                        </div>
                        <StatusBadge
                          status={readinessStateToBadgeStatus(check.state)}
                          label={check.state.replace(/_/g, " ")}
                          size="sm"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {check.detail}
                      </p>
                      {check.href && check.actionLabel ? (
                        <Link
                          href={check.href}
                          className="inline-flex items-center text-xs font-medium text-primary hover:underline"
                        >
                          {check.actionLabel} <ArrowRightIcon className="ml-1 h-3 w-3" />
                        </Link>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <Skeleton className="h-40 w-full" />
                )}
              </CardContent>
            </Card>

            <Card className="border-border/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Proof and Memory
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {overview ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-border/60 p-3">
                        <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
                          Evidence artifacts
                        </p>
                        <p className="mt-2 text-2xl font-black">
                          {overview.counts.evidenceArtifacts.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {overview.counts.degradedEvidenceArtifacts} degraded
                        </p>
                      </div>
                      <div className="rounded-lg border border-border/60 p-3">
                        <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
                          Finalized proof
                        </p>
                        <p className="mt-2 text-2xl font-black">
                          {overview.counts.finalizedProofPackages.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Export-grade packages</p>
                      </div>
                    </div>
                    <div className="rounded-lg border border-border/60 p-3">
                      <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
                        Adjudication memory
                      </p>
                      <p className="mt-2 text-2xl font-black">
                        {overview.counts.adjudicationMemories.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Durable operator decisions recorded for reuse
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>Latest run</span>
                        <span className="font-medium text-foreground">
                          {formatActivationTimestamp(overview.lastRunAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Latest operator decision</span>
                        <span className="font-medium text-foreground">
                          {formatActivationTimestamp(overview.lastDecisionAt)}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <Skeleton className="h-40 w-full" />
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                First-Customer Activation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {overview ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border/60 p-3">
                      <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
                        Workspaces
                      </p>
                      <p className="mt-2 text-2xl font-black">
                        {overview.counts.workspaces.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {overview.counts.activeWorkspaces} active
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/60 p-3">
                      <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
                        Integrations
                      </p>
                      <p className="mt-2 text-2xl font-black">
                        {overview.counts.connectedIntegrations.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Connected today</p>
                    </div>
                    <div className="rounded-lg border border-border/60 p-3">
                      <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
                        Runs
                      </p>
                      <p className="mt-2 text-2xl font-black">
                        {overview.counts.reconciliationRuns.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Tenant-scoped history</p>
                    </div>
                    <div className="rounded-lg border border-border/60 p-3">
                      <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
                        Unresolved queue
                      </p>
                      <p className="mt-2 text-2xl font-black">
                        {overview.counts.unresolvedExceptions.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Needs operator review</p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/60 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <PlugZap className="h-4 w-4 text-primary" />
                      <p className="text-sm font-semibold">Workspace preview</p>
                    </div>
                    {overview.workspaces.length > 0 ? (
                      <div className="space-y-2">
                        {overview.workspaces.slice(0, 3).map((workspace) => (
                          <div
                            key={workspace.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <div>
                              <p className="font-medium">{workspace.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {workspace.slug} · {workspace.role}
                              </p>
                            </div>
                            <StatusBadge
                              status={workspace.isActive ? "completed" : "warning"}
                              label={workspace.isActive ? "active" : "inactive"}
                              size="sm"
                            />
                          </div>
                        ))}
                        {overview.workspaces.length > 3 ? (
                          <Link
                            href="/console/organizations"
                            className="inline-flex items-center text-xs font-medium text-primary hover:underline"
                          >
                            View all workspaces <ArrowRightIcon className="ml-1 h-3 w-3" />
                          </Link>
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No workspace is attached to this operator yet.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <Skeleton className="h-60 w-full" />
              )}
            </CardContent>
          </Card>

          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-primary" />
                Next Operator Steps
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {overview ? (
                overview.tasks.map((task) => (
                  <div key={task.id} className="rounded-lg border border-border/60 p-3 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{task.label}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {task.description}
                        </p>
                      </div>
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
                    <Link href={task.href}>
                      <Button
                        variant={task.state === "completed" ? "outline" : "default"}
                        size="sm"
                      >
                        {task.actionLabel}
                        <ArrowRight className="ml-2 h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                ))
              ) : (
                <Skeleton className="h-72 w-full" />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
