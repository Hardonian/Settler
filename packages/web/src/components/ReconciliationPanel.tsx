"use strict";

import React from "react";

const ReconciliationPanel: React.FC = () => {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm overflow-hidden animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Matched vs. Unmatched</h3>
        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-500/10 text-teal-500 border border-teal-500/20">
          Sync Active
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Matched Transactions</span>
            <span className="font-mono text-teal-500">1,284</span>
          </div>
          <div className="h-2 w-full bg-neutral-20 rounded-full overflow-hidden">
            <div className="h-full bg-teal-500 rounded-full w-[85%]" />
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Automatic reconciliation successful for 85% of total volume based on current confidence threshold (0.92).
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Unmatched (Manual Review)</span>
            <span className="font-mono text-blue-400">216</span>
          </div>
          <div className="h-2 w-full bg-neutral-20 rounded-full overflow-hidden">
            <div className="h-full bg-blue-400 rounded-full w-[15%]" />
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Requires intervention. Common causes: fuzzy amount matching, timestamp drift, or vendor mismatch.
          </p>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-border flex justify-end gap-3">
        <button className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors border border-border rounded-md hover:bg-neutral-20">
          Review Mismatches
        </button>
        <button className="px-4 py-2 text-sm font-medium bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-colors shadow-sm shadow-teal-500/20">
          Bulk Reconcile
        </button>
      </div>
    </div>
  );
};

export default ReconciliationPanel;
