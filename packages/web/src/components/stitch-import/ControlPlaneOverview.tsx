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
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
            <Building className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 leading-none mb-0.5">
              Workspace
            </span>
            <span className="flex items-center gap-1 text-sm font-bold text-slate-900 leading-none">
              Acme Corp / Prod
              <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" aria-hidden="true" />
            </span>
          </div>
        </button>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          <RefreshCw className="h-3 w-3" aria-hidden="true" />
          Sample data
        </span>
      </div>

      {/* Critical alert (dismissible) */}
      {!alertDismissed && (
        <div className="relative overflow-hidden rounded-xl border-l-4 border-red-500 bg-white p-4 shadow-sm flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-red-100 bg-red-50">
            <AlertTriangle className="h-5 w-5 text-red-600" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              Critical Alert
              <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                P0
              </span>
            </h3>
            <p className="mt-0.5 text-xs font-medium leading-relaxed text-slate-600">
              Webhook latency &gt; 500ms in EU-West region. Automatic scaling in progress.
            </p>
          </div>
          <button
            onClick={() => setAlertDismissed(true)}
            className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Dismiss alert"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* System health metrics */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">System Health</h2>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-green-200 bg-green-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-green-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-green-500" aria-hidden="true" />
            Stable
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex h-[120px] flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Uptime (24h)
              </span>
              <Gauge className="h-5 w-5 rounded-md bg-blue-50 p-1 text-primary" aria-hidden="true" />
            </div>
            <div>
              <div className="text-3xl font-bold tracking-tight text-slate-900">
                99.98<span className="text-lg text-slate-400">%</span>
              </div>
              <div className="mt-1 flex w-fit items-center gap-1 rounded bg-green-50 px-1.5 py-0.5 text-xs font-bold text-green-600">
                <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                +0.01%
              </div>
            </div>
          </div>
          <div className="flex h-[120px] flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Backlog Queue
              </span>
              <Gauge className="h-5 w-5 rounded-md bg-orange-50 p-1 text-orange-600" aria-hidden="true" />
            </div>
            <div>
              <div className="text-3xl font-bold tracking-tight text-slate-900">452</div>
              <div className="mt-1 flex w-fit items-center gap-1 rounded bg-green-50 px-1.5 py-0.5 text-xs font-bold text-green-600">
                <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
                −12% items
              </div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-orange-200 bg-white p-5 shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-l from-orange-50 via-white to-white opacity-80 pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between mb-3">
            <span className="flex items-center gap-2 rounded bg-orange-100/50 px-2 py-1 text-xs font-bold uppercase tracking-wider text-orange-800">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
              </span>
              Mismatch Anomaly Risk
            </span>
            <AlertTriangle className="h-6 w-6 text-orange-600" aria-hidden="true" />
          </div>
          <div className="relative z-10 flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-slate-900">12 Spikes</div>
              <div className="mt-1 text-xs font-medium text-slate-500">Detected in last 60m</div>
            </div>
            <button className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition-all hover:border-primary/30 hover:bg-slate-50 hover:text-primary">
              View Log
            </button>
          </div>
        </div>
      </div>

      {/* Active runs */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Active Runs</h2>
          <button className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-primary transition-colors hover:bg-blue-100">
            See All (3)
          </button>
        </div>
        <div className="space-y-3">
          {/* Run 1 */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="p-4">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-primary shadow-sm">
                    <RefreshCw className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Run #8821</h4>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="rounded border border-blue-200 bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                        Running
                      </span>
                      <span className="font-mono text-xs font-medium text-slate-400">2m 14s</span>
                    </div>
                  </div>
                </div>
                <button
                  aria-label="More options for Run #8821"
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  <MoreVertical className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-dashed border-slate-200 py-3">
                <div>
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Volume
                  </div>
                  <div className="text-sm font-bold text-slate-900">$1.2M</div>
                </div>
                <div>
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Trace ID
                  </div>
                  <div className="flex w-fit items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-sm text-slate-600">
                    trc_8a9...b2
                    <button
                      aria-label="Copy trace ID"
                      className="ml-1 text-slate-400 transition-colors hover:text-primary"
                    >
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex border-t border-slate-200 bg-slate-50/50">
              <button className="flex h-10 flex-1 items-center justify-center gap-1.5 border-r border-slate-200 text-xs font-bold text-red-600 transition-colors hover:bg-red-50">
                <XCircle className="h-5 w-5" aria-hidden="true" />
                Abort
              </button>
              <button className="flex h-10 flex-1 items-center justify-center gap-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100">
                <Eye className="h-5 w-5" aria-hidden="true" />
                Details
              </button>
            </div>
          </div>

          {/* Run 2 */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="p-4">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-100 bg-amber-50 text-amber-600 shadow-sm">
                    <RefreshCw className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Run #8820</h4>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="rounded border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        Retrying
                      </span>
                      <span className="font-mono text-xs font-medium text-slate-400">0m 45s</span>
                    </div>
                  </div>
                </div>
                <button
                  aria-label="More options for Run #8820"
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  <MoreVertical className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-dashed border-slate-200 py-3">
                <div>
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Volume
                  </div>
                  <div className="text-sm font-bold text-slate-900">$850K</div>
                </div>
                <div>
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Trace ID
                  </div>
                  <div className="flex w-fit items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-sm text-slate-600">
                    trc_2c4...e1
                    <button
                      aria-label="Copy trace ID"
                      className="ml-1 text-slate-400 transition-colors hover:text-primary"
                    >
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex border-t border-slate-200 bg-slate-50/50">
              <button className="flex h-10 flex-1 items-center justify-center gap-1.5 border-r border-slate-200 text-xs font-bold text-red-600 transition-colors hover:bg-red-50">
                <XCircle className="h-5 w-5" aria-hidden="true" />
                Abort
              </button>
              <button className="flex h-10 flex-1 items-center justify-center gap-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100">
                <Eye className="h-5 w-5" aria-hidden="true" />
                Details
              </button>
            </div>
          </div>

          {/* Run 3 (queued) */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white opacity-80 shadow-sm">
            <div className="p-4">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-600">
                    <Clock className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Run #8819</h4>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                        Queued
                      </span>
                      <span className="font-mono text-xs font-medium text-slate-400">—</span>
                    </div>
                  </div>
                </div>
                <button
                  aria-label="More options for Run #8819"
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  <MoreVertical className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-dashed border-slate-200 py-3">
                <div>
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Volume
                  </div>
                  <div className="text-sm font-bold text-slate-900">$3.4M</div>
                </div>
                <div>
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Trace ID
                  </div>
                  <div className="flex w-fit items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-sm text-slate-600">
                    trc_x91...p0
                    <button
                      aria-label="Copy trace ID"
                      className="ml-1 text-slate-400 transition-colors hover:text-primary"
                    >
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex border-t border-slate-200 bg-slate-50/50">
              <button className="flex h-10 w-full items-center justify-center gap-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100">
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
