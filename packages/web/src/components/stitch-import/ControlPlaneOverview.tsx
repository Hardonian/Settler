"use client";

import React, { useState } from "react";
import {
  Building,
  ChevronDown,
  RefreshCw,
  AlertTriangle,
  X,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  Copy,
  XCircle,
  Eye,
  Clock,
  Gauge,
} from "lucide-react";
import { DemoBanner } from "@/components/app/DemoBanner";

const ControlPlaneOverview: React.FC = () => {
  const [alertDismissed, setAlertDismissed] = useState(false);

  return (
    <div className="space-y-6">
      <DemoBanner label="Metrics, run cards, and alerts below are sample data. Wire the control-plane API to populate this surface with live telemetry." />

      {/* Workspace selector */}
      <div className="flex items-center justify-between">
        <button className="group flex items-center gap-3" aria-label="Switch workspace">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Building className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-none mb-0.5">
              Workspace
            </span>
            <span className="flex items-center gap-1 text-sm font-bold text-foreground leading-none">
              Acme Corp / Prod
              <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden="true" />
            </span>
          </div>
        </button>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 border border-border px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          <RefreshCw className="h-3 w-3" aria-hidden="true" />
          Sample data
        </span>
      </div>

      {/* Critical alert (dismissible) */}
      {!alertDismissed && (
        <div className="relative overflow-hidden rounded-xl border-l-4 border-error bg-card p-4 shadow-sm flex items-start gap-3 border border-border/60">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              Critical Alert
              <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold text-red-700 dark:text-red-400">
                P0
              </span>
            </h3>
            <p className="mt-0.5 text-xs font-medium leading-relaxed text-muted-foreground">
              Webhook latency &gt; 500ms in EU-West region. Automatic scaling in progress.
            </p>
          </div>
          <button
            onClick={() => setAlertDismissed(true)}
            className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Dismiss alert"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* System health metrics */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">System Health</h2>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-green-700 dark:text-green-400 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
            Stable
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex h-[120px] flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Uptime (24h)
              </span>
              <Gauge className="h-5 w-5 rounded-md bg-primary/10 p-1 text-primary" aria-hidden="true" />
            </div>
            <div>
              <div className="text-3xl font-bold tracking-tight text-foreground">
                99.98<span className="text-lg text-muted-foreground">%</span>
              </div>
              <div className="mt-1 flex w-fit items-center gap-1 rounded bg-green-500/10 px-1.5 py-0.5 text-xs font-bold text-green-600 dark:text-green-400">
                <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                +0.01%
              </div>
            </div>
          </div>
          <div className="flex h-[120px] flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Backlog Queue
              </span>
              <Gauge className="h-5 w-5 rounded-md bg-amber-500/10 p-1 text-amber-600" aria-hidden="true" />
            </div>
            <div>
              <div className="text-3xl font-bold tracking-tight text-foreground">452</div>
              <div className="mt-1 flex w-fit items-center gap-1 rounded bg-green-500/10 px-1.5 py-0.5 text-xs font-bold text-green-600 dark:text-green-400">
                <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
                −12% items
              </div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-card p-5 shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-l from-amber-500/5 via-transparent to-transparent opacity-80 pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between mb-3">
            <span className="flex items-center gap-2 rounded bg-amber-500/10 px-2 py-1 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
              </span>
              Mismatch Anomaly Risk
            </span>
            <AlertTriangle className="h-6 w-6 text-amber-600" aria-hidden="true" />
          </div>
          <div className="relative z-10 flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-foreground">12 Spikes</div>
              <div className="mt-1 text-xs font-medium text-muted-foreground">Detected in last 60m</div>
            </div>
            <button className="rounded-lg border border-border bg-card px-4 py-2 text-xs font-bold text-foreground shadow-sm transition-all hover:border-primary/30 hover:bg-muted/40 hover:text-primary">
              View Log
            </button>
          </div>
        </div>
      </div>

      {/* Active runs */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Active Runs</h2>
          <button className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary transition-colors hover:bg-primary/15">
            See All (3)
          </button>
        </div>
        <div className="space-y-3">
          {/* Run 1 */}
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="p-4">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary shadow-sm">
                    <RefreshCw className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Run #8821</h4>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="rounded border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-400">
                        Running
                      </span>
                      <span className="font-mono text-xs font-medium text-muted-foreground">2m 14s</span>
                    </div>
                  </div>
                </div>
                <button
                  aria-label="More options for Run #8821"
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <MoreVertical className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-dashed border-border/60 py-3">
                <div>
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Volume
                  </div>
                  <div className="text-sm font-bold text-foreground">$1.2M</div>
                </div>
                <div>
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Trace ID
                  </div>
                  <div className="flex w-fit items-center gap-1 rounded border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-sm text-foreground">
                    trc_8a9...b2
                    <button
                      aria-label="Copy trace ID"
                      className="ml-1 text-muted-foreground transition-colors hover:text-primary"
                    >
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex border-t border-border bg-muted/20">
              <button className="flex h-10 flex-1 items-center justify-center gap-1.5 border-r border-border text-xs font-bold text-red-600 dark:text-red-400 transition-colors hover:bg-red-500/10">
                <XCircle className="h-5 w-5" aria-hidden="true" />
                Abort
              </button>
              <button className="flex h-10 flex-1 items-center justify-center gap-1.5 text-xs font-bold text-foreground transition-colors hover:bg-muted/50">
                <Eye className="h-5 w-5" aria-hidden="true" />
                Details
              </button>
            </div>
          </div>

          {/* Run 2 */}
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="p-4">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-600 shadow-sm">
                    <RefreshCw className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Run #8820</h4>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="rounded border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                        Retrying
                      </span>
                      <span className="font-mono text-xs font-medium text-muted-foreground">0m 45s</span>
                    </div>
                  </div>
                </div>
                <button
                  aria-label="More options for Run #8820"
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <MoreVertical className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-dashed border-border/60 py-3">
                <div>
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Volume
                  </div>
                  <div className="text-sm font-bold text-foreground">$850K</div>
                </div>
                <div>
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Trace ID
                  </div>
                  <div className="flex w-fit items-center gap-1 rounded border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-sm text-foreground">
                    trc_2c4...e1
                    <button
                      aria-label="Copy trace ID"
                      className="ml-1 text-muted-foreground transition-colors hover:text-primary"
                    >
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex border-t border-border bg-muted/20">
              <button className="flex h-10 flex-1 items-center justify-center gap-1.5 border-r border-border text-xs font-bold text-red-600 dark:text-red-400 transition-colors hover:bg-red-500/10">
                <XCircle className="h-5 w-5" aria-hidden="true" />
                Abort
              </button>
              <button className="flex h-10 flex-1 items-center justify-center gap-1.5 text-xs font-bold text-foreground transition-colors hover:bg-muted/50">
                <Eye className="h-5 w-5" aria-hidden="true" />
                Details
              </button>
            </div>
          </div>

          {/* Run 3 (queued) */}
          <div className="overflow-hidden rounded-xl border border-border bg-card opacity-80 shadow-sm">
            <div className="p-4">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                    <Clock className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Run #8819</h4>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="rounded border border-border bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                        Queued
                      </span>
                      <span className="font-mono text-xs font-medium text-muted-foreground">—</span>
                    </div>
                  </div>
                </div>
                <button
                  aria-label="More options for Run #8819"
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <MoreVertical className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-dashed border-border/60 py-3">
                <div>
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Volume
                  </div>
                  <div className="text-sm font-bold text-foreground">$3.4M</div>
                </div>
                <div>
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Trace ID
                  </div>
                  <div className="flex w-fit items-center gap-1 rounded border border-border bg-muted/40 px-1.5 py-0.5 font-mono text-sm text-foreground">
                    trc_x91...p0
                    <button
                      aria-label="Copy trace ID"
                      className="ml-1 text-muted-foreground transition-colors hover:text-primary"
                    >
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex border-t border-border bg-muted/20">
              <button className="flex h-10 w-full items-center justify-center gap-1.5 text-xs font-bold text-foreground transition-colors hover:bg-muted/50">
                <Eye className="h-5 w-5" aria-hidden="true" />
                Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPlaneOverview;
