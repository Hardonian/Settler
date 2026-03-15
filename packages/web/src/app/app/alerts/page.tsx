"use client";

import React, { useState } from "react";
import {
  Search,
  AlertCircle,
  Server,
  ListChecks,
  BellOff,
  AlertTriangle,
  Building,
  BookOpen,
  Info,
  FileText,
  Download,
  Lock,
} from "lucide-react";
import { DemoBanner } from "@/components/app/DemoBanner";

type FilterTab = "open" | "ack" | "resolved";

export default function AlertsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("open");

  return (
    <div className="space-y-4">
      {/* Page heading — rendered by the app shell header; we only need content here */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Operator Intelligence
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">Live Alerts</h1>
      </div>

      <DemoBanner label="Alert counts and card content are sample data. Connect an alerting backend to populate this surface with live events." />

      {/* Summary strip */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        <div className="flex min-w-[140px] flex-1 items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <div className="h-2 w-2 animate-pulse rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
          <div>
            <span className="block text-2xl font-bold leading-none text-red-600">2</span>
            <span className="text-xs font-medium uppercase tracking-wider text-red-500">
              Critical
            </span>
          </div>
        </div>
        <div className="flex min-w-[140px] flex-1 items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="h-2 w-2 rounded-full bg-amber-500" />
          <div>
            <span className="block text-2xl font-bold leading-none text-amber-600">5</span>
            <span className="text-xs font-medium uppercase tracking-wider text-amber-500">
              Warning
            </span>
          </div>
        </div>
        <div className="flex min-w-[140px] flex-1 items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <div>
            <span className="block text-2xl font-bold leading-none text-primary">12</span>
            <span className="text-xs font-medium uppercase tracking-wider text-primary/70">
              Info
            </span>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div
        role="tablist"
        aria-label="Alert filter"
        className="flex rounded-lg bg-slate-100 p-1"
      >
        {(
          [
            { id: "open", label: "Open (14)" },
            { id: "ack", label: "Ack (4)" },
            { id: "resolved", label: "Resolved" },
          ] as { id: FilterTab; label: string }[]
        ).map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            onClick={() => setActiveTab(id)}
            className={
              activeTab === id
                ? "flex-1 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-slate-900 shadow-sm transition-all"
                : "flex-1 rounded-md px-3 py-1.5 text-sm font-medium text-slate-500 transition-all hover:text-slate-900"
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* Alert feed */}
      <div className="space-y-3">
        {/* Alert 1: Critical */}
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-transform duration-200 active:scale-[0.98]">
          <div className="absolute bottom-0 left-0 top-0 w-1.5 bg-red-500" />
          <div className="p-4 pl-5">
            <div className="mb-2 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" aria-hidden="true" />
                <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                  Critical
                </span>
              </div>
              <span className="font-mono text-xs text-slate-400">2m ago</span>
            </div>
            <h3 className="mb-1 text-base font-semibold leading-tight text-slate-900">
              Payment Gateway Timeout — 500 Error
            </h3>
            <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
              <Server className="h-4 w-4" aria-hidden="true" />
              <span>api-gateway</span>
              <span className="h-1 w-1 rounded-full bg-slate-400" />
              <span>us-east-1</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-primary/20 bg-primary/5 px-2.5 py-1 font-mono text-xs font-medium text-primary transition-colors hover:bg-primary/10">
                <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
                TRC-9928-X
              </span>
              <div className="flex gap-2">
                <button
                  aria-label="Silence this alert"
                  className="rounded-lg bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
                >
                  <BellOff className="h-5 w-5" aria-hidden="true" />
                </button>
                <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90">
                  Ack
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Alert 2: Warning (expanded) */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-l-[6px] border-amber-500 p-4 pl-5">
            <div className="mb-2 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden="true" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                  Warning
                </span>
              </div>
              <span className="font-mono text-xs text-slate-400">15m ago</span>
            </div>
            <h3 className="mb-1 text-base font-semibold leading-tight text-slate-900">
              Reconciliation Delay &gt; 5m
            </h3>
            <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
              <Building className="h-4 w-4" aria-hidden="true" />
              <span>ledger-service</span>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-4">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex -space-x-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[10px] font-medium">
                    JD
                  </div>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-300 text-[10px] text-slate-500">
                    +1
                  </div>
                </div>
                <span className="text-xs text-slate-500">
                  Acknowledged by{" "}
                  <span className="font-medium text-slate-900">Jane Doe</span>
                </span>
              </div>
              <div className="relative mb-4 space-y-4 pl-3 before:absolute before:bottom-1 before:left-0 before:top-1 before:w-px before:bg-slate-200">
                <div className="relative pl-4">
                  <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-slate-300" />
                  <p className="text-xs leading-tight text-slate-500">
                    Alert triggered on{" "}
                    <span className="font-mono">thresh_latency_high</span>
                  </p>
                </div>
                <div className="relative pl-4">
                  <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-primary ring-4 ring-primary/20" />
                  <p className="text-xs font-medium leading-tight text-slate-900">
                    Runbook suggestion: Check DB locks
                  </p>
                  <button className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                    <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                    View SOP-Ledger-04
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 rounded-lg bg-slate-100 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200">
                  Escalate
                </button>
                <button className="flex-1 rounded-lg bg-primary/10 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20">
                  Resolve
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Alert 3: Info */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm transition-transform duration-200 active:scale-[0.98]">
          <div className="border-l-[6px] border-primary p-4 pl-5">
            <div className="mb-2 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" aria-hidden="true" />
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Info
                </span>
              </div>
              <span className="font-mono text-xs text-slate-400">1h ago</span>
            </div>
            <h3 className="mb-1 text-base font-semibold leading-tight text-slate-900">
              Daily Settlement Report Generated
            </h3>
            <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
              <FileText className="h-4 w-4" aria-hidden="true" />
              <span>reporting-service</span>
            </div>
            <div className="mt-2">
              <button className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs font-medium text-slate-500 transition-colors hover:text-primary">
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                RPT-settlement-latest.pdf
              </button>
            </div>
          </div>
        </div>

        {/* Alert 4: Critical (silenced) */}
        <div className="rounded-xl border border-slate-200 bg-white opacity-60 shadow-sm transition-transform duration-200 active:scale-[0.98]">
          <div className="border-l-[6px] border-red-500 p-4 pl-5">
            <div className="mb-2 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" aria-hidden="true" />
                <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                  Critical
                </span>
              </div>
              <span className="font-mono text-xs text-slate-400">3h ago</span>
            </div>
            <h3 className="mb-1 text-base font-semibold leading-tight text-slate-900 line-through decoration-slate-400">
              High Latency on Auth Service
            </h3>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Lock className="h-4 w-4" aria-hidden="true" />
              <span>auth-service</span>
              <span className="ml-auto rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
                Silenced
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder="Search alerts…"
          aria-label="Search alerts"
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
    </div>
  );
}
