"use client";

import React, { memo } from "react";
import {
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertCircle,
  Zap,
} from "lucide-react";
import type { OperatorRunDetail } from "@/types/operator-run-detail";

interface RunStatisticsProps {
  summary: OperatorRunDetail["summary"];
  runDelta: OperatorRunDetail["runDelta"];
  configDrift: OperatorRunDetail["configDrift"];
  compactProofSummary: OperatorRunDetail["compactProofSummary"];
}

export const RunStatistics = memo(function RunStatistics({
  summary,
  runDelta,
  configDrift,
  compactProofSummary,
}: RunStatisticsProps) {
  const proofOp = compactProofSummary.operatorSummary;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Matched Transactions"
          value={summary.matched}
          delta={runDelta?.matchedDelta ?? 0}
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          label="Exceptions Found"
          value={summary.unmatched}
          delta={runDelta?.exceptionDelta ?? 0}
          icon={AlertCircle}
          color="red"
          inverse
        />
        <StatCard label="Input Volume" value={summary.total} delta={0} icon={Zap} color="blue" />
        <StatCard
          label="Conflict Rate"
          value={summary.conflicts}
          delta={0}
          icon={BarChart3}
          color="yellow"
        />
      </div>

      <div className="p-5 rounded-2xl border bg-gradient-to-br from-card/30 to-muted/20 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider">Run delta vs prior run</h3>
        </div>
        {!runDelta ? (
          <p className="text-xs text-muted-foreground mb-4 border border-dashed rounded-lg p-3">
            No prior-run delta is recorded for this run yet. When available, input stability, pattern
            changes, and config drift flags appear here.
          </p>
        ) : null}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase">
              Input & configuration
            </h4>
            <div className="flex items-center justify-between p-3 rounded-lg border bg-background/50">
              <span className="text-sm">Input hash (vs prior)</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  runDelta?.inputChanged
                    ? "bg-red-500/10 text-red-500 border-red-500/20"
                    : runDelta
                      ? "bg-green-500/10 text-green-500 border-green-500/20"
                      : "bg-muted/40 text-muted-foreground border-border/60"
                }`}
              >
                {runDelta ? (runDelta.inputChanged ? "CHANGED" : "STABLE") : "NO DELTA"}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border bg-background/50">
              <span className="text-sm">Snapshot config drift</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  configDrift.status === "detected"
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25"
                    : configDrift.status === "indeterminate"
                      ? "bg-muted/50 text-muted-foreground border-border/60"
                      : "bg-green-500/10 text-green-600 border-green-500/20"
                }`}
              >
                {configDrift.status === "detected"
                  ? `DETECTED (${configDrift.adapter})`
                  : configDrift.status === "indeterminate"
                    ? "INDETERMINATE"
                    : "NONE"}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border bg-background/50">
              <span className="text-sm">Delta config drift flag</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  runDelta?.configDriftDetected
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25"
                    : runDelta
                      ? "bg-green-500/10 text-green-600 border-green-500/20"
                      : "bg-muted/40 text-muted-foreground border-border/60"
                }`}
              >
                {runDelta
                  ? runDelta.configDriftDetected
                    ? "YES"
                    : "NO"
                  : "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border bg-background/50">
              <span className="text-sm">Reconciliation coverage</span>
              <span className="text-sm font-mono font-bold">
                {Math.round((summary.matched / (summary.total || 1)) * 100)}%
              </span>
            </div>
            <div className="rounded-lg border bg-background/50 p-3 space-y-1">
              <span className="text-sm">Proof / history signal (run-level)</span>
              <p className="text-xs text-muted-foreground leading-relaxed">{proofOp.summary}</p>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase">
              Exception pattern delta
            </h4>
            <div className="min-h-[100px] flex flex-col justify-center rounded-lg border border-dashed p-4 text-xs">
              {runDelta?.newExceptionPatterns && runDelta.newExceptionPatterns.length > 0 ? (
                <ul className="w-full space-y-2 text-left">
                  {runDelta.newExceptionPatterns.map((p, i) => (
                    <li key={i} className="flex items-center gap-2 text-red-600 dark:text-red-400">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center italic">
                  No new exception patterns in the recorded run delta.
                </p>
              )}
            </div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase pt-2">
              Resolved patterns (prior run)
            </h4>
            <div className="min-h-[72px] flex flex-col justify-center rounded-lg border border-dashed p-4 text-xs">
              {runDelta?.resolvedPatterns && runDelta.resolvedPatterns.length > 0 ? (
                <ul className="w-full space-y-2 text-left">
                  {runDelta.resolvedPatterns.map((p, i) => (
                    <li key={i} className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="w-3 h-3 shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-center italic">
                  No resolved patterns recorded on this delta.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

function StatCard({ label, value, delta, icon: Icon, color, inverse = false }: any) {
  const colors: Record<string, string> = {
    green: "text-green-600 bg-green-500/10",
    red: "text-red-600 bg-red-500/10",
    blue: "text-blue-600 bg-blue-500/10",
    yellow: "text-yellow-600 bg-yellow-500/10",
  };

  const isPositive = delta > 0;
  const isBadDelta = inverse ? isPositive : !isPositive && delta !== 0;

  return (
    <div className="p-4 rounded-xl border bg-card/40 flex items-center justify-between group hover:border-primary/30 transition-all">
      <div className="space-y-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-tight">
          {label}
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tighter">{value.toLocaleString()}</span>
          {delta !== 0 && (
            <div
              className={`flex items-center text-[10px] font-bold ${
                isBadDelta ? "text-red-500" : "text-green-500"
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {Math.abs(delta)}
            </div>
          )}
        </div>
      </div>
      <div
        className={`p-2.5 rounded-lg ${colors[color]} group-hover:scale-110 transition-transform`}
      >
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}
