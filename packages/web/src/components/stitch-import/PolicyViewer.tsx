"use client";

import React from "react";
import { Filter, Plus, FileCheck, Scale, Clock } from "lucide-react";
import { DemoBanner } from "@/components/app/DemoBanner";

const PolicyViewer: React.FC = () => {
  return (
    <section className="space-y-4">
      <DemoBanner label="Policy entries below are sample data. Connect the policy API to display live RLS policies." />

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
          RLS Policies
        </h3>
        <div className="flex gap-1">
          <button
            aria-label="Filter policies"
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Filter className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            aria-label="Add policy"
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {/* Policy 1 */}
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-3">
            <div className="rounded bg-blue-500/10 p-1.5 text-blue-500">
              <FileCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Transaction_View</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                <p className="font-mono text-[10px] text-slate-500">public.transactions</p>
              </div>
            </div>
          </div>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
            SELECT
          </span>
        </div>

        {/* Policy 2 */}
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-3">
            <div className="rounded bg-amber-500/10 p-1.5 text-amber-500">
              <Scale className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Settlement_Approve</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                <p className="font-mono text-[10px] text-slate-500">restricted.approvals</p>
              </div>
            </div>
          </div>
          <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
            UPDATE
          </span>
        </div>

        {/* Policy 3 (inactive) */}
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 opacity-60">
          <div className="flex items-center gap-3">
            <div className="rounded bg-slate-500/10 p-1.5 text-slate-500">
              <Clock className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Audit_Write</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden="true" />
                <p className="font-mono text-[10px] text-slate-500">system.logs</p>
              </div>
            </div>
          </div>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
            INSERT
          </span>
        </div>
      </div>
    </section>
  );
};

export default PolicyViewer;
