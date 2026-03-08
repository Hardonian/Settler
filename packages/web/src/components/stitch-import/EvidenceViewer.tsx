"use client";

import React from "react";
import { AlertCircle, X, CheckCircle, XCircle } from "lucide-react";

const EvidenceViewer: React.FC = () => {
  return (
    <div className="fixed inset-x-0 bottom-[72px] z-30 transform transition-transform duration-300 ease-out translate-y-0 shadow-[0_-8px_30px_rgba(0,0,0,0.5)] bg-background-light dark:bg-surface-dark rounded-t-2xl border-t border-slate-200 dark:border-slate-700 max-h-[70vh] flex flex-col">
      {/* Drag Handle */}
      <div className="w-full flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
        <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></div>
      </div>
      {/* Sheet Header */}
      <div className="px-5 pb-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Evidence Viewer</h3>
          <p className="text-xs text-rose-500 font-medium flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5" /> Mismatched · Trace 8a9f...2b1
          </p>
        </div>
        <button className="text-slate-400 hover:text-white">
          <X className="h-6 w-6" />
        </button>
      </div>
      {/* Sheet Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Comparison View */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
              Comparison
            </span>
            <span className="text-xs text-primary font-medium cursor-pointer hover:underline">
              View Raw JSON
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Source A */}
            <div className="flex flex-col gap-2">
              <div className="text-xs font-medium text-slate-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Source: Stripe API
              </div>
              <div className="p-3 bg-white dark:bg-[#0c1219] border border-slate-200 dark:border-slate-700 rounded-lg">
                <div className="text-[10px] text-slate-400 uppercase">Amount</div>
                <div className="font-mono text-sm text-slate-900 dark:text-slate-100">
                  100.00 USD
                </div>
                <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-2"></div>
                <div className="text-[10px] text-slate-400 uppercase">Status</div>
                <div className="font-mono text-sm text-slate-900 dark:text-slate-100">
                  succeeded
                </div>
              </div>
            </div>
            {/* Source B */}
            <div className="flex flex-col gap-2">
              <div className="text-xs font-medium text-slate-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span> Source: Internal DB
              </div>
              <div className="p-3 bg-white dark:bg-[#0c1219] border border-rose-500/50 rounded-lg relative overflow-hidden">
                {/* Highlight mismatch */}
                <div className="absolute inset-0 bg-rose-500/5 pointer-events-none"></div>
                <div className="text-[10px] text-slate-400 uppercase">Amount</div>
                <div className="font-mono text-sm text-rose-500 font-bold">99.00 USD</div>
                <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-2"></div>
                <div className="text-[10px] text-slate-400 uppercase">Status</div>
                <div className="font-mono text-sm text-slate-900 dark:text-slate-100">
                  completed
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Rules Applied */}
        <div>
          <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-2 block">
            Logic Trace
          </span>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-[#0c1219] border border-emerald-500/30 rounded-lg">
              <CheckCircle className="h-5 w-5 text-emerald-500" />
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-200">
                  Currency Match
                </div>
                <div className="text-xs text-slate-500">Both sources are USD</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-[#0c1219] border border-rose-500/30 rounded-lg">
              <XCircle className="h-5 w-5 text-rose-500" />
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-200">
                  Exact Amount Match
                </div>
                <div className="text-xs text-rose-400">Values differ by &gt; 0.00</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Sheet Footer Actions */}
      <div className="p-5 border-t border-slate-200 dark:border-slate-700 bg-background-light dark:bg-surface-dark flex gap-3">
        <button className="flex-1 py-3 px-4 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-semibold text-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
          Ignore Mismatch
        </button>
        <button className="flex-1 py-3 px-4 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-blue-600 transition-colors shadow-lg shadow-primary/25">
          Open in Review Queue
        </button>
      </div>
    </div>
  );
};

export default EvidenceViewer;
