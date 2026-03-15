"use client";

import React from "react";
import {
  MoreVertical,
  Shield,
  RefreshCw,
  Settings,
  Clock,
  ChevronDown,
  Unlock,
  Send,
  SlidersHorizontal,
  Webhook,
  KeyRound,
  Copy,
  Cloud,
} from "lucide-react";
import { DemoBanner } from "@/components/app/DemoBanner";

// Realistic relative activity log entries (no hardcoded year)
const githubActivity = [
  { ts: "2 hours ago", status: "200 OK", variant: "ok" as const },
  { ts: "8 hours ago", status: "200 OK", variant: "ok" as const },
  { ts: "5 days ago", status: "429 Rate Limit", variant: "warn" as const },
];

const IntegrationList: React.FC = () => {
  return (
    <main className="space-y-8 py-2">
      <DemoBanner label="Integration cards and activity logs are sample data. Connect the integrations API to display live connector status." />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Active Services</h2>
          <button className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
            View All
          </button>
        </div>

        {/* GitHub */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">
          <div className="p-5">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm">
                  <svg fill="currentColor" height="24" viewBox="0 0 24 24" width="24" aria-hidden="true">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.285 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">GitHub</h3>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                      Healthy
                    </span>
                    <span className="text-xs font-medium text-slate-500">• Repo:Read</span>
                  </div>
                </div>
              </div>
              <button
                aria-label="More options for GitHub integration"
                className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100"
              >
                <MoreVertical size={24} aria-hidden="true" />
              </button>
            </div>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Expires
                </p>
                <p className="text-sm font-semibold text-slate-700">28 days</p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Privilege
                </p>
                <div className="flex items-center gap-1 text-amber-600">
                  <Shield size={14} aria-hidden="true" />
                  <span className="text-xs font-semibold">Read-Only</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-primary/10 bg-primary/10 text-xs font-semibold text-primary transition-colors hover:bg-primary/20">
                <RefreshCw size={16} aria-hidden="true" />
                Rotate Token
              </button>
              <button className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50">
                <Settings size={16} aria-hidden="true" />
                Test
              </button>
            </div>
          </div>
          <div className="border-t border-slate-100 bg-slate-50/50">
            <details className="group/accordion">
              <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3 transition-colors hover:bg-slate-50">
                <span className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <Clock size={16} aria-hidden="true" />
                  Recent Activity
                </span>
                <ChevronDown
                  className="text-slate-400 transition-transform group-open/accordion:rotate-180"
                  size={18}
                  aria-hidden="true"
                />
              </summary>
              <div className="space-y-2 border-t border-slate-100 bg-white px-5 pb-4 pt-3">
                {githubActivity.map(({ ts, status, variant }) => (
                  <div
                    key={ts}
                    className="flex items-center justify-between border-b border-slate-50 pb-2 text-xs last:border-0 last:pb-0"
                  >
                    <span className="font-mono text-slate-500">{ts}</span>
                    <span
                      className={
                        variant === "ok"
                          ? "inline-flex items-center rounded border border-emerald-100 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600"
                          : "inline-flex items-center rounded border border-amber-100 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-600"
                      }
                    >
                      {status}
                    </span>
                  </div>
                ))}
                <button className="block w-full pt-2 text-center text-xs font-medium text-primary transition-colors hover:underline">
                  View Full Audit Log
                </button>
              </div>
            </details>
          </div>
        </div>

        {/* Slack */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">
          <div className="p-5">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#4A154B] text-white shadow-sm">
                  <svg fill="currentColor" height="24" viewBox="0 0 24 24" width="24" aria-hidden="true">
                    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.52v-6.315zm8.834-5.04a2.528 2.528 0 0 1 2.521-2.521A2.528 2.528 0 0 1 20.211 10.124a2.528 2.528 0 0 1-2.521 2.521h-2.522v-2.52zm-1.263 0a2.528 2.528 0 0 1-2.521 2.521 2.527 2.527 0 0 1-2.52-2.521V5.042a2.528 2.528 0 0 1 2.52-2.52 2.528 2.528 0 0 1 2.521 2.52v6.314zM8.834 3.79a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.52v2.523H8.834zM10.1 5.042a2.528 2.528 0 0 1 2.52-2.52 2.528 2.528 0 0 1 2.522 2.52v6.313A2.528 2.528 0 0 1 12.62 13.894a2.528 2.528 0 0 1-2.52-2.52V5.042z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Slack</h3>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                      Degraded
                    </span>
                    <span className="text-xs font-medium text-slate-500">• Webhook</span>
                  </div>
                </div>
              </div>
              <button
                aria-label="More options for Slack integration"
                className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100"
              >
                <MoreVertical size={24} aria-hidden="true" />
              </button>
            </div>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Expires
                </p>
                <p className="text-sm font-semibold text-slate-700">Never</p>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Privilege
                </p>
                <div className="flex items-center gap-1 text-slate-500">
                  <Unlock size={14} aria-hidden="true" />
                  <span className="text-xs font-semibold">Write-Only</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary text-xs font-semibold text-white shadow-sm transition-colors hover:bg-primary/90">
                <Send size={16} aria-hidden="true" />
                Test Message
              </button>
              <button className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50">
                <SlidersHorizontal size={16} aria-hidden="true" />
                Config
              </button>
            </div>
          </div>
        </div>

        {/* Custom Hook */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">
          <div className="p-5">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
                  <Webhook size={24} aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Custom Hook</h3>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden="true" />
                      Expired
                    </span>
                  </div>
                </div>
              </div>
              <button
                aria-label="More options for Custom Hook integration"
                className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100"
              >
                <MoreVertical size={24} aria-hidden="true" />
              </button>
            </div>
            <div className="mb-4">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Endpoint
              </p>
              <div className="flex items-center gap-2 rounded border border-slate-200 bg-slate-50 p-2.5 shadow-inner">
                <code className="flex-1 truncate font-mono text-xs text-slate-600">
                  https://api.mysite.com/hook/v1/payment_events
                </code>
                <button
                  aria-label="Copy endpoint URL"
                  className="text-slate-400 transition-colors hover:text-primary"
                >
                  <Copy size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100">
                <KeyRound size={16} aria-hidden="true" />
                Renew Secret
              </button>
            </div>
          </div>
        </div>
      </section>

      <hr className="border-slate-200" />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">Available to Connect</h2>
        <div className="grid grid-cols-2 gap-4">
          <button className="group flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition-transform group-hover:scale-110">
              <svg fill="currentColor" height="20" viewBox="0 0 24 24" width="20" aria-hidden="true">
                <path d="M11.53 2C6.454 1.96 2.073 5.923 2 11h9.53V2zM12.47 2v9h9.53C21.93 5.96 17.546 2.077 12.47 2zM2 13c.073 5.077 4.454 9.04 9.53 9V13H2zm19.47 0H12.47l.06 9C17.576 21.93 21.96 18.01 22 13z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-slate-900">Jira</span>
            <span className="mt-1 text-xs text-slate-500">Issue Tracking</span>
          </button>
          <button className="group flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-orange-600 transition-transform group-hover:scale-110">
              <Cloud size={24} aria-hidden="true" />
            </div>
            <span className="text-sm font-semibold text-slate-900">AWS</span>
            <span className="mt-1 text-xs text-slate-500">CloudWatch</span>
          </button>
        </div>
      </section>
    </main>
  );
};

export default IntegrationList;
