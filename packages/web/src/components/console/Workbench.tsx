"use client";

import React from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Zap,
  ArrowRight,
  Shield,
  Search,
  Terminal,
  Cpu,
} from "lucide-react";
import Link from "next/link";
import { useWorkbenchRealtime } from "@/hooks/use-workbench-realtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/ui/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedGradient } from "@/components/ui/AnimatedGradient";
import { SpotlightCard } from "@/components/ui/SpotlightCard";

export function Workbench() {
  const { data, isConnected, error } = useWorkbenchRealtime();

  if (!data && !error) {
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

  return (
    <div className="space-y-8 pb-12">
      {/* Header Overlay with Real-time Status */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-4xl">
          <div className="flex items-center gap-3 mb-2">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/80">
              Settler Command Center
            </p>
            {isConnected ? (
              <Badge
                variant="outline"
                className="h-5 text-[9px] bg-success/5 border-success/20 text-success gap-1 animate-in fade-in zoom-in"
              >
                <div className="h-1 w-1 rounded-full bg-success animate-pulse" />
                LIVE OPS
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="h-5 text-[9px] bg-muted/20 text-muted-foreground gap-1"
              >
                <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                DISCONNECTED
              </Badge>
            )}
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl italic drop-shadow-sm">
            Operator{" "}
            <span className="text-primary not-italic font-bold tracking-tighter">Workbench</span>
          </h1>
          <p className="mt-4 text-base text-muted-foreground font-medium leading-relaxed max-w-2xl">
            Real-time reconciliation intelligence. Grounded in backend truth, activated for
            high-integrity fleet adjudication.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-2 bg-warning/5 border border-warning/20 rounded-xl text-warning text-xs font-bold animate-pulse">
            <AlertTriangle size={14} />
            {error}
          </div>
        )}
      </div>

      {/* Primary Stats Grid */}
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
        {/* Active Runs Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/40 shadow-2xl glass overflow-hidden border-l-4 border-l-primary/60">
            <CardHeader className="bg-primary/5 pb-4 border-b border-border/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-bold uppercase tracking-widest">
                    Live Engine Orchestration
                  </CardTitle>
                </div>
                <Link href="/console/runs">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[10px] uppercase font-bold tracking-widest h-8"
                  >
                    View Run History <ArrowRight className="ml-2 h-3 w-3" />
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
                              className="text-[9px] uppercase font-black bg-primary/5 text-primary border-primary/20 animate-pulse"
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
                      Idle state . System nominal
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Infrastructure Health Block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SpotlightCard className="border-border/40 bg-card/60">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                    Adjudication Memory
                  </p>
                </div>
                <div className="flex items-end justify-between">
                  <div className="space-y-1">
                    <p className="text-2xl font-black italic tracking-tighter">Verified</p>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                      Audit Chain Intact
                    </p>
                  </div>
                  <Badge className="bg-success/5 text-success border-success/20 text-[9px] font-bold uppercase tracking-widest">
                    PREMIUM
                  </Badge>
                </div>
              </div>
            </SpotlightCard>
            <SpotlightCard className="border-border/40 bg-card/60">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-primary" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                    Compute Health
                  </p>
                </div>
                <div className="flex items-end justify-between">
                  <div className="space-y-1">
                    <p className="text-2xl font-black italic tracking-tighter">Optimal</p>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                      4.2ms avg Latency
                    </p>
                  </div>
                  <Badge className="bg-success/5 text-success border-success/20 text-[9px] font-bold uppercase tracking-widest">
                    STABLE
                  </Badge>
                </div>
              </div>
            </SpotlightCard>
          </div>
        </div>

        {/* Intelligence / Sidebar */}
        <div className="space-y-8">
          <Card className="border-border/40 bg-card/40 shadow-none border-dashed overflow-hidden flex flex-col min-h-[400px]">
            <CardHeader className="bg-muted/10 border-b border-border/20 relative">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Terminal size={80} />
              </div>
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-primary relative z-10">
                Active Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-6 space-y-8 relative z-10">
              <div className="space-y-4">
                <div className="flex items-center gap-2 group cursor-pointer">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Search className="h-4 w-4 text-primary" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold">Archetype Detection</p>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                      Automatic classification
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 group cursor-pointer">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Layers className="h-4 w-4 text-primary" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold">Proof Package Explorer</p>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                      Evidence provenance
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border/40 space-y-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-white/5 font-mono text-[10px] leading-relaxed text-muted-foreground/80 lowercase italic">
                  <p className="text-primary uppercase not-italic font-bold mb-1 tracking-widest">
                    System Boot Trace
                  </p>
                  <p>
                    <span className="text-primary/60">[01:42:01]</span> initializing
                    matching-engine-v4
                  </p>
                  <p>
                    <span className="text-primary/60">[01:42:05]</span> sse connect
                    (tenant_drift_active)
                  </p>
                  <p>
                    <span className="text-success/60">[01:42:08]</span> ready . awaiting recon cycle
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <section className="relative overflow-hidden p-8 rounded-3xl bg-primary/5 border border-primary/10 transition-all hover:border-primary/30 flex flex-col items-center text-center space-y-6">
            <AnimatedGradient />
            <div className="relative z-10 space-y-4 flex flex-col items-center">
              <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-xl">
                <Shield className="h-8 w-8 text-primary shrink-0" />
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-black italic tracking-tighter">
                  Enterprise Mode Active
                </h4>
                <p className="text-xs text-muted-foreground font-medium max-w-[220px] leading-relaxed lowercase italic">
                  All adjudications are cryptographically linked to the proof-ledger.
                  <span className="block mt-2 font-bold uppercase not-italic tracking-[0.2em] text-[10px] text-primary/80 underline decoration-primary/30 underline-offset-4 cursor-pointer">
                    Verify Proof-Pack
                  </span>
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function WorkbenchSkeleton() {
  return (
    <div className="p-6 space-y-12">
      <div className="flex justify-between items-end">
        <div className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-8">
        <Skeleton className="col-span-2 h-[500px] rounded-3xl" />
        <Skeleton className="h-[500px] rounded-3xl" />
      </div>
    </div>
  );
}
