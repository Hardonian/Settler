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
}

export const RunStatistics = memo(function RunStatistics({
  summary,
  runDelta,
}: RunStatisticsProps) {
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
          <h3 className="text-sm font-bold tracking-tight uppercase tracking-wider">
            Comparative Drift Insights
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase">
              Input Patterns
            </h4>
            <div className="flex items-center justify-between p-3 rounded-lg border bg-background/50">
              <span className="text-sm">Input Hash Stability</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  runDelta?.inputChanged
                    ? "bg-red-500/10 text-red-500 border-red-500/20"
                    : "bg-green-500/10 text-green-500 border-green-500/20"
                }`}
              >
                {runDelta?.inputChanged ? "CHANGED" : "STABLE"}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border bg-background/50">
              <span className="text-sm">Reconciliation Coverage</span>
              <span className="text-sm font-mono font-bold">
                {Math.round((summary.matched / (summary.total || 1)) * 100)}%
              </span>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase">
              New Exception Patterns
            </h4>
            <div className="min-h-[100px] flex flex-col justify-center items-center rounded-lg border border-dashed p-4 opacity-50 italic text-xs text-center">
              {runDelta?.newExceptionPatterns && runDelta.newExceptionPatterns.length > 0 ? (
                <ul className="w-full space-y-2 text-left not-italic opacity-100">
                  {runDelta.newExceptionPatterns.map((p, i) => (
                    <li key={i} className="flex items-center gap-2 text-red-500">
                      <AlertCircle className="w-3 h-3" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                "No new exception patterns detected in this run delta."
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
