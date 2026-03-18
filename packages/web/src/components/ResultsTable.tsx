"use client";

import React from "react";
import { AlertTriangle, Search, ArrowRight } from "lucide-react";

const ResultsTable: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-slate-100 p-4 mb-4">
        <Search className="h-8 w-8 text-slate-400" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">
        Reconciliation Results Not Yet Available
      </h3>
      <p className="text-sm text-slate-600 max-w-md mb-4">
        This surface will display transaction reconciliation results once the results API is
        connected to the backend reconciliation engine. Currently, no real reconciliation data is
        available.
      </p>

      {/* Next Steps */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 max-w-lg mb-4">
        <p className="text-xs font-semibold text-slate-900 mb-2">Alternative Access</p>
        <div className="space-y-2 text-left">
          <div className="flex items-start gap-2">
            <ArrowRight className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" aria-hidden="true" />
            <p className="text-xs text-slate-700">
              View reconciliation run history via <strong>Runs</strong> page
            </p>
          </div>
          <div className="flex items-start gap-2">
            <ArrowRight className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" aria-hidden="true" />
            <p className="text-xs text-slate-700">
              Access detailed match data via{" "}
              <strong>API: GET /api/v1/reconciliation/runs/:runId/matches</strong>
            </p>
          </div>
          <div className="flex items-start gap-2">
            <ArrowRight className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" aria-hidden="true" />
            <p className="text-xs text-slate-700">
              Use reconciliation workbench via{" "}
              <strong>API: GET /api/v1/reconciliation/runs/:runId/workbench</strong>
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 max-w-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" aria-hidden="true" />
          <div className="text-left">
            <p className="text-xs font-semibold text-amber-900 mb-1">Implementation Status</p>
            <p className="text-xs text-amber-700">
              The results table requires wiring to the reconciliation service and establishing the
              results data contract. This surface has been downgraded to an honest no-data state to
              avoid displaying fake reconciliation theater.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsTable;
