"use client";

import React from "react";

interface ReconciliationPanelProps {
  matchedCount: number;
  unmatchedCount: number;
  totalVolume: number;
  confidenceThreshold?: number;
}

const ReconciliationPanel: React.FC<ReconciliationPanelProps> = ({
  matchedCount,
  unmatchedCount,
  totalVolume,
  confidenceThreshold = 0.92,
}) => {
  const matchedPercentage = totalVolume > 0 ? Math.round((matchedCount / totalVolume) * 100) : 0;
  const unmatchedPercentage =
    totalVolume > 0 ? Math.round((unmatchedCount / totalVolume) * 100) : 0;

  return (
    <div className="panel glass p-6 shadow-md overflow-hidden animate-slide-up border-teal-500/10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-foreground">
            Operational Reconciliation
          </h3>
          <p className="text-sm text-muted">Real-time matching parity and exception distribution</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-semibold uppercase tracking-wider animate-pulse">
          <div className="status-dot-ok" />
          Active
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Matched Section */}
        <div className="space-y-5 p-4 rounded-xl bg-teal-500/5 border border-teal-500/10 transition-all hover:border-teal-500/30">
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <span className="section-eyebrow">Parity (Matched)</span>
              <div className="text-3xl font-bold tabular-nums text-teal-500">
                {matchedPercentage}%
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted block mb-1">Volume</span>
              <span className="font-mono text-sm font-semibold text-foreground/80">
                {matchedCount.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="h-3 w-full bg-neutral-200/20 dark:bg-white/5 rounded-full overflow-hidden shadow-inner border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-teal-600 to-teal-400 rounded-full transition-all duration-1000 ease-out will-change-transform w-[var(--p-width)]"
              style={{ "--p-width": `${matchedPercentage}%` } as React.CSSProperties}
            />
          </div>

          <p className="text-xs text-muted leading-relaxed italic">
            Settlement parity achieved for {matchedCount.toLocaleString()} transactions against a
            confidence threshold of{" "}
            <span className="text-teal-500 font-semibold">{confidenceThreshold}</span>.
          </p>
        </div>

        {/* Unmatched Section */}
        <div className="space-y-5 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 transition-all hover:border-blue-500/30">
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <span className="section-eyebrow">Intelligence (Queue)</span>
              <div className="text-3xl font-bold tabular-nums text-blue-400">
                {unmatchedPercentage}%
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted block mb-1">Items</span>
              <span className="font-mono text-sm font-semibold text-foreground/80">
                {unmatchedCount.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="h-3 w-full bg-neutral-200/20 dark:bg-white/5 rounded-full overflow-hidden shadow-inner border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-1000 ease-out will-change-transform w-[var(--p-width)]"
              style={{ "--p-width": `${unmatchedPercentage}%` } as React.CSSProperties}
            />
          </div>

          <p className="text-xs text-muted leading-relaxed">
            Requires intervention via the Intelligence Workbench. Common signatures:
            <span className="text-blue-400"> fuzzy amount mismatch</span> or{" "}
            <span className="text-blue-400">date drift</span>.
          </p>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex -space-x-2">
          {/* Mock active operators for social proof/activity vibes */}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-full border-2 border-card bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-[10px] font-bold"
            >
              OP
            </div>
          ))}
          <div className="px-3 py-1 flex items-center text-xs text-muted bg-muted/50 rounded-full translate-x-4 border border-border">
            3 active operators
          </div>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-semibold text-muted hover:text-foreground transition-all border border-border rounded-lg hover:bg-muted active:scale-95">
            Workbench
          </button>
          <button className="flex-1 sm:flex-none px-5 py-2.5 text-sm font-semibold bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-all shadow-lg shadow-teal-500/20 active:scale-95">
            Bulk Resolve
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReconciliationPanel;
