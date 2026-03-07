"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { safeFetch } from "@/lib/safe-fetch";
import type { ReplayLabReport, ReplayStep } from "@/lib/replay-lab/engine";

interface ReplayPageProps {
  params: Promise<{ executionId: string }>;
}

function sourceLabel(source: string): string {
  return source.replace("_", " ");
}

export default function ReplayExecutionPage({ params }: ReplayPageProps) {
  const [report, setReport] = useState<ReplayLabReport | null>(null);
  const [selectedStep, setSelectedStep] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load(): Promise<void> {
      const resolved = await params;
      setLoading(true);
      const response = await safeFetch<ReplayLabReport>(
        `/api/v1/runs/${resolved.executionId}/replay`
      );
      if (response.success && response.data) {
        setReport(response.data);
      } else {
        setReport(null);
      }
      setLoading(false);
    }

    load();
  }, [params]);

  const activeStep: ReplayStep | null = useMemo(() => {
    if (!report) return null;
    return report.timeline[selectedStep] ?? null;
  }, [report, selectedStep]);

  const moveStep = (delta: number): void => {
    if (!report) return;
    setSelectedStep((value) => Math.max(0, Math.min(report.timeline.length - 1, value + delta)));
  };

  if (loading) {
    return <div className="p-6 text-slate-500">Loading replay timeline…</div>;
  }

  if (!report) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Replay unavailable</CardTitle>
            <CardDescription>Could not load this execution replay.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Replay Lab · {report.executionId}</CardTitle>
          <CardDescription>
            Deterministic replay with timeline inspection and divergence diffing.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <div>Total steps: {report.summary.totalSteps}</div>
          <div>Diverged steps: {report.summary.divergedSteps}</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(report.summary.divergenceSources).map(([source, count]) => (
              <Badge key={source} variant={count > 0 ? "destructive" : "secondary"}>
                {sourceLabel(source)}: {count}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Execution timeline</CardTitle>
            <CardDescription>Step-by-step replay with breakpoint simulation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.timeline.map((step) => (
              <button
                key={step.id}
                className={`w-full rounded border p-3 text-left ${selectedStep === step.index ? "border-sky-500 bg-sky-50/60 dark:bg-sky-950/20" : "border-slate-200 dark:border-slate-700"}`}
                onClick={() => setSelectedStep(step.index)}
                type="button"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    {step.index + 1}. {step.name}
                  </div>
                  <Badge variant={step.status === "diverged" ? "destructive" : "secondary"}>
                    {step.status}
                  </Badge>
                </div>
                <div className="text-xs text-slate-500 mt-1">{step.durationMs}ms</div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step inspector</CardTitle>
            <CardDescription>Inspect step outputs, snapshots, and replay controls.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => moveStep(-1)}>
                Previous step
              </Button>
              <Button variant="outline" onClick={() => moveStep(1)}>
                Next step
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedStep(report.controls.breakpoints[0] ?? 0)}
              >
                Jump to breakpoint
              </Button>
            </div>
            {activeStep ? (
              <>
                <div className="text-sm">
                  Active step: <strong>{activeStep.name}</strong>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <pre className="rounded bg-slate-900 text-green-300 text-xs p-3 overflow-x-auto">
                    {JSON.stringify(activeStep.originalResult, null, 2)}
                  </pre>
                  <pre className="rounded bg-slate-900 text-cyan-300 text-xs p-3 overflow-x-auto">
                    {JSON.stringify(activeStep.replayResult, null, 2)}
                  </pre>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700" />
                <div className="text-xs text-slate-500">State snapshots</div>
                <div className="grid md:grid-cols-2 gap-3">
                  <pre className="rounded bg-slate-900 text-green-300 text-xs p-3 overflow-x-auto">
                    {JSON.stringify(activeStep.originalStateSnapshot, null, 2)}
                  </pre>
                  <pre className="rounded bg-slate-900 text-cyan-300 text-xs p-3 overflow-x-auto">
                    {JSON.stringify(activeStep.replayStateSnapshot, null, 2)}
                  </pre>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>State diff view</CardTitle>
          <CardDescription>Original run vs replay run differences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            Original fingerprint: <code>{report.diff.originalFingerprint.slice(0, 24)}</code> ·
            Replay fingerprint: <code>{report.diff.replayFingerprint.slice(0, 24)}</code>
          </div>
          {report.diff.entries.length === 0 ? (
            <div className="text-sm text-emerald-600">
              No divergence detected. Replay is deterministic.
            </div>
          ) : (
            <div className="space-y-2">
              {report.diff.entries.map((entry) => (
                <div
                  key={entry.path}
                  className="rounded border border-amber-300 bg-amber-50 p-3 text-xs dark:bg-amber-950/20"
                >
                  <div className="font-semibold">{entry.path}</div>
                  <div>Source: {sourceLabel(entry.source)}</div>
                  <div>Original: {JSON.stringify(entry.original)}</div>
                  <div>Replay: {JSON.stringify(entry.replay)}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
