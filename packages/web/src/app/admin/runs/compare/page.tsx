/**
 * Run Comparison Page
 *
 * Compare two reconciliation runs side-by-side.
 */

"use client";

import { useState } from "react";
import { useAdminRuns } from "@/lib/admin/hooks/use-admin-metrics";
import { ReconciliationRun } from "@/lib/admin/metrics/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";
import Link from "next/link";

export default function CompareRunsPage({
  searchParams,
}: {
  searchParams: { run1?: string; run2?: string };
}) {
  const [run1Id, setRun1Id] = useState(searchParams.run1 || "");
  const [run2Id, setRun2Id] = useState(searchParams.run2 || "");

  const { data: runsData } = useAdminRuns({ limit: 1000 });

  const run1 = runsData?.items?.find((r: { id: string }) => r.id === run1Id);
  const run2 = runsData?.items?.find((r: { id: string }) => r.id === run2Id);

  const getDiff = (
    val1: number,
    val2: number
  ): { value: number; percent: number; trend: "down" | "up" | "neutral" } => {
    if (val1 === 0 && val2 === 0) return { value: 0, percent: 0, trend: "neutral" as const };
    const diff = val2 - val1;
    const percent = val1 > 0 ? (diff / val1) * 100 : diff > 0 ? 100 : -100;
    return {
      value: diff,
      percent: Math.abs(percent),
      trend: (diff > 0 ? "up" : diff < 0 ? "down" : "neutral") as "down" | "up" | "neutral",
    };
  };

  return (
    <div className="p-8 space-y-6 bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/runs">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Compare Runs</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Side-by-side comparison of reconciliation runs
            </p>
          </div>
        </div>
      </div>

      {/* Run Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Runs to Compare</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Run 1</label>
              <select
                value={run1Id}
                onChange={(e) => setRun1Id(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded px-3 py-2 bg-white dark:bg-slate-900"
              >
                <option value="">Select run...</option>
                {runsData?.items?.map((run: ReconciliationRun) => (
                  <option key={run.id} value={run.id}>
                    {run.name || run.id.slice(0, 8)} - {run.status} -{" "}
                    {new Date(run.startedAt).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Run 2</label>
              <select
                value={run2Id}
                onChange={(e) => setRun2Id(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded px-3 py-2 bg-white dark:bg-slate-900"
              >
                <option value="">Select run...</option>
                {runsData?.items?.map((run: ReconciliationRun) => (
                  <option key={run.id} value={run.id}>
                    {run.name || run.id.slice(0, 8)} - {run.status} -{" "}
                    {new Date(run.startedAt).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison */}
      {run1 && run2 && (
        <div className="grid grid-cols-2 gap-6">
          {/* Run 1 */}
          <Card>
            <CardHeader>
              <CardTitle>{run1.name || `Run ${run1.id.slice(0, 8)}`}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <MetricRow label="Status" value={run1.status} />
              <MetricRow label="Matched" value={run1.matchedCount} />
              <MetricRow label="Unmatched Source" value={run1.unmatchedSourceCount} />
              <MetricRow label="Unmatched Target" value={run1.unmatchedTargetCount} />
              <MetricRow
                label="Confidence"
                value={
                  run1.confidenceAvg ? `${(Number(run1.confidenceAvg) * 100).toFixed(1)}%` : "N/A"
                }
              />
              <MetricRow label="Started" value={new Date(run1.startedAt).toLocaleString()} />
            </CardContent>
          </Card>

          {/* Run 2 */}
          <Card>
            <CardHeader>
              <CardTitle>{run2.name || `Run ${run2.id.slice(0, 8)}`}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <MetricRow label="Status" value={run2.status} />
              <MetricRow
                label="Matched"
                value={run2.matchedCount}
                diff={getDiff(run1.matchedCount, run2.matchedCount)}
              />
              <MetricRow
                label="Unmatched Source"
                value={run2.unmatchedSourceCount}
                diff={getDiff(run1.unmatchedSourceCount, run2.unmatchedSourceCount)}
              />
              <MetricRow
                label="Unmatched Target"
                value={run2.unmatchedTargetCount}
                diff={getDiff(run1.unmatchedTargetCount, run2.unmatchedTargetCount)}
              />
              <MetricRow
                label="Confidence"
                value={
                  run2.confidenceAvg ? `${(Number(run2.confidenceAvg) * 100).toFixed(1)}%` : "N/A"
                }
                {...(run1.confidenceAvg && run2.confidenceAvg
                  ? {
                      diff: getDiff(
                        Number(run1.confidenceAvg) * 100,
                        Number(run2.confidenceAvg) * 100
                      ),
                    }
                  : {})}
              />
              <MetricRow label="Started" value={new Date(run2.startedAt).toLocaleString()} />
            </CardContent>
          </Card>
        </div>
      )}

      {(!run1 || !run2) && (
        <Card>
          <CardContent className="py-12 text-center text-slate-500 dark:text-slate-400">
            Select two runs to compare
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MetricRow({
  label,
  value,
  diff,
}: {
  label: string;
  value: string | number;
  diff?: { value: number; percent: number; trend: "up" | "down" | "neutral" };
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}:</span>
      <div className="flex items-center gap-2">
        <span className="font-semibold text-slate-900 dark:text-white">{value}</span>
        {diff && diff.trend !== "neutral" && (
          <div
            className={`flex items-center gap-1 text-xs ${
              diff.trend === "up" ? "text-green-600" : "text-red-600"
            }`}
          >
            {diff.trend === "up" ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{diff.percent.toFixed(1)}%</span>
          </div>
        )}
        {diff && diff.trend === "neutral" && <Minus className="w-3 h-3 text-slate-400" />}
      </div>
    </div>
  );
}
