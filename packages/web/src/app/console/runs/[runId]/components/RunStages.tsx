"use client";

import React, { memo } from "react";
import { CheckCircle2, Circle, Clock, Loader2, XCircle, AlertCircle } from "lucide-react";
import type { OperatorRunStageRow } from "@/types/operator-run-detail";

interface RunStagesProps {
  stages: OperatorRunStageRow[];
}

export const RunStages = memo(function RunStages({ stages }: RunStagesProps) {
  if (!stages || stages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 opacity-60">
        <Clock className="w-10 h-10 mb-2" />
        <p className="text-sm italic">Audit-derived stages not available for this run.</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-500 bg-green-500/10 border-green-500/20";
      case "running":
        return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      case "failed":
        return "text-red-500 bg-red-500/10 border-red-500/20";
      default:
        return "text-muted-foreground bg-muted/30 border-muted-foreground/10";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4" />;
      case "running":
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case "failed":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Circle className="w-4 h-4 opacity-50" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className={`p-4 rounded-xl border flex items-center justify-between transition-all duration-300 hover:shadow-md ${getStatusColor(
              stage.status
            )}`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-white/20 dark:bg-black/20">
                {getStatusIcon(stage.status)}
              </div>
              <div>
                <h4 className="font-semibold text-sm capitalize">{stage.name}</h4>
                <div className="flex items-center gap-2 mt-0.5 opacity-80 font-mono text-[10px]">
                  {stage.startedAt && (
                    <span title="Started">{new Date(stage.startedAt).toLocaleTimeString()}</span>
                  )}
                  {stage.completedAt && (
                    <>
                      <span>→</span>
                      <span title="Completed">
                        {new Date(stage.completedAt).toLocaleTimeString()}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {stage.error && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/20 text-red-600 dark:text-red-400">
                <AlertCircle className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold">ERROR</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="p-4 rounded-xl border border-dashed border-muted-foreground/20 bg-muted/5">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Audit Resolution
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Stages are derived from the reconciliation audit trail and represent physically
              executed transitions in the underlying workers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});
