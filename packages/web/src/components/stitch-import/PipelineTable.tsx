"use client";

import React from "react";
import {
  Search,
  Filter,
  RefreshCw,
  MoreVertical,
  ArrowRightCircle,
  Webhook,
  Terminal,
  AlertTriangle,
  Database,
  Code,
  PauseCircle,
  Play,
  Wrench,
  Gauge,
} from "lucide-react";

const PipelineTable: React.FC = () => {
  return (
    <main className="flex-1 px-4 py-4 pb-24 space-y-4">
      {/* Search/Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-6 w-6" />
          <input
            className="w-full rounded-lg bg-card dark:bg-[#192633] border border-border dark:border-border py-2.5 pl-10 pr-4 text-sm text-foreground dark:text-white focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted-foreground outline-none transition-all"
            placeholder="Search pipelines..."
            type="text"
          />
        </div>
        <button className="flex items-center justify-center rounded-lg bg-card dark:bg-[#192633] border border-border dark:border-border px-3 text-muted-foreground dark:text-muted-foreground hover:text-primary hover:border-primary dark:hover:text-primary transition-colors">
          <Filter className="h-6 w-6" />
        </button>
      </div>
      {/* Pipeline List */}
      <div className="flex flex-col gap-3">
        {/* Pipeline Item 1: Active/Healthy */}
        <div className="group relative overflow-hidden rounded-xl bg-card dark:bg-[#192633] border border-border dark:border-border p-4 shadow-sm transition-all hover:border-primary/50">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
                <RefreshCw className="h-6 w-6" />
                <span className="absolute -right-1 -top-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-foreground dark:text-white text-sm">
                  payment_reconciliation_v2
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="inline-flex items-center rounded-md bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-500 ring-1 ring-inset ring-green-500/20">
                    Healthy
                  </span>
                  <span className="text-xs text-muted-foreground dark:text-muted-foreground">• 2m ago</span>
                </div>
              </div>
            </div>
            <button className="text-muted-foreground hover:text-muted-foreground dark:hover:text-slate-200">
              <MoreVertical className="h-6 w-6" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Input
              </span>
              <div className="flex items-center gap-1.5">
                <ArrowRightCircle className="h-4 w-4 text-primary" />
                <span className="text-xs text-foreground dark:text-muted-foreground truncate">
                  Stripe Connect
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Output
              </span>
              <div className="flex items-center gap-1.5">
                <Webhook className="h-4 w-4 text-purple-400" />
                <span className="text-xs text-foreground dark:text-muted-foreground truncate">
                  S3: settled-trans
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-end justify-between border-t border-slate-100 dark:border-border pt-3 mt-1">
            <div className="flex flex-col gap-1 w-full mr-4">
              <span className="text-[10px] text-muted-foreground">Error Trend (24h)</span>
              {/* Sparkline (SVG) */}
              <svg
                className="h-6 w-full text-green-500 stroke-current"
                fill="none"
                preserveAspectRatio="none"
                viewBox="0 0 100 20"
              >
                <path
                  d="M0 10 Q 10 15, 20 10 T 40 10 T 60 5 T 80 12 T 100 8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                ></path>
              </svg>
            </div>
            <div className="flex gap-2 shrink-0">
              <button className="flex items-center justify-center h-8 px-3 rounded-lg bg-muted/40 dark:bg-card text-xs font-medium text-muted-foreground dark:text-muted-foreground hover:bg-slate-200 dark:hover:bg-muted transition-colors">
                History
              </button>
              <button className="flex items-center justify-center h-8 px-3 rounded-lg bg-primary/10 text-xs font-medium text-primary hover:bg-primary/20 transition-colors gap-1">
                <Terminal className="h-3.5 w-3.5" />
                Config
              </button>
            </div>
          </div>
        </div>
        {/* Pipeline Item 2: Failed/Critical */}
        <div className="group relative overflow-hidden rounded-xl bg-card dark:bg-[#192633] border border-red-200 dark:border-red-900/30 p-4 shadow-sm transition-all">
          <div className="absolute inset-y-0 left-0 w-1 bg-red-500"></div>
          <div className="flex items-start justify-between mb-3 pl-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground dark:text-white text-sm">
                  ledger_sync_daily
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="inline-flex items-center rounded-md bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-500 ring-1 ring-inset ring-red-500/20">
                    Critical
                  </span>
                  <span className="text-xs text-muted-foreground dark:text-muted-foreground">• 15m ago</span>
                </div>
              </div>
            </div>
            <button className="text-muted-foreground hover:text-muted-foreground dark:hover:text-slate-200">
              <MoreVertical className="h-6 w-6" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-3 pl-2">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Input
              </span>
              <div className="flex items-center gap-1.5">
                <Database className="h-4 w-4 text-primary" />
                <span className="text-xs text-foreground dark:text-muted-foreground truncate">
                  Postgres DB
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Output
              </span>
              <div className="flex items-center gap-1.5">
                <Code className="h-4 w-4 text-orange-400" />
                <span className="text-xs text-foreground dark:text-muted-foreground truncate">
                  Internal API
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-end justify-between border-t border-slate-100 dark:border-border pt-3 mt-1 pl-2">
            <div className="flex flex-col gap-1 w-full mr-4">
              <span className="text-[10px] text-muted-foreground">Error Trend (24h)</span>
              <svg
                className="h-6 w-full text-red-500 stroke-current"
                fill="none"
                preserveAspectRatio="none"
                viewBox="0 0 100 20"
              >
                <path
                  d="M0 18 Q 20 18, 40 10 T 60 5 L 80 15 L 100 2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                ></path>
              </svg>
            </div>
            <div className="flex gap-2 shrink-0">
              <button className="flex items-center justify-center h-8 px-3 rounded-lg bg-primary text-xs font-medium text-white shadow-sm hover:bg-blue-600 transition-colors gap-1">
                <Wrench className="h-3.5 w-3.5" />
                Fix
              </button>
            </div>
          </div>
        </div>
        {/* Pipeline Item 3: Paused */}
        <div className="group relative overflow-hidden rounded-xl bg-card dark:bg-[#192633] border border-border dark:border-border p-4 shadow-sm opacity-75 hover:opacity-100 transition-all">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200 dark:bg-muted text-muted-foreground dark:text-muted-foreground">
                <PauseCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground dark:text-white text-sm">
                  fraud_detection_stream
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="inline-flex items-center rounded-md bg-muted/40 dark:bg-card px-2 py-0.5 text-xs font-medium text-muted-foreground dark:text-muted-foreground ring-1 ring-inset ring-slate-500/10">
                    Paused
                  </span>
                  <span className="text-xs text-muted-foreground dark:text-muted-foreground">• 4h ago</span>
                </div>
              </div>
            </div>
            <button className="text-muted-foreground hover:text-muted-foreground dark:hover:text-slate-200">
              <MoreVertical className="h-6 w-6" />
            </button>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-border pt-3 mt-3">
            <span className="text-xs text-muted-foreground italic">Configuration frozen at v1.2.0</span>
            <button className="text-primary hover:text-primary/80 text-xs font-medium flex items-center gap-1">
              <Play className="h-3.5 w-3.5" /> Resume
            </button>
          </div>
        </div>
        {/* Pipeline Item 4: Active/Degraded */}
        <div className="group relative overflow-hidden rounded-xl bg-card dark:bg-[#192633] border border-border dark:border-border p-4 shadow-sm transition-all hover:border-primary/50">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-500">
                <Gauge className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground dark:text-white text-sm">
                  inventory_aggregator
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="inline-flex items-center rounded-md bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-500 ring-1 ring-inset ring-yellow-500/20">
                    Degraded
                  </span>
                  <span className="text-xs text-muted-foreground dark:text-muted-foreground">• 5m ago</span>
                </div>
              </div>
            </div>
            <button className="text-muted-foreground hover:text-muted-foreground dark:hover:text-slate-200">
              <MoreVertical className="h-6 w-6" />
            </button>
          </div>
          <div className="flex items-end justify-between border-t border-slate-100 dark:border-border pt-3 mt-1">
            <div className="flex flex-col gap-1 w-full mr-4">
              <span className="text-[10px] text-muted-foreground">Error Trend (24h)</span>
              <svg
                className="h-6 w-full text-yellow-500 stroke-current"
                fill="none"
                preserveAspectRatio="none"
                viewBox="0 0 100 20"
              >
                <path
                  d="M0 15 Q 15 15, 25 10 T 50 12 T 75 5 T 100 8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                ></path>
              </svg>
            </div>
            <div className="flex gap-2 shrink-0">
              <button className="flex items-center justify-center h-8 px-3 rounded-lg bg-muted/40 dark:bg-card text-xs font-medium text-muted-foreground dark:text-muted-foreground hover:bg-slate-200 dark:hover:bg-muted transition-colors">
                History
              </button>
              <button className="flex items-center justify-center h-8 px-3 rounded-lg bg-primary/10 text-xs font-medium text-primary hover:bg-primary/20 transition-colors gap-1">
                <Terminal className="h-3.5 w-3.5" />
                Config
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default PipelineTable;
