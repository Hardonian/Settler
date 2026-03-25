"use client";

/**
 * Run / execution context for a DriftEvent on the console exception detail page.
 *
 * DriftEvent.reconJobId is resolved via the same dual-model path as the run list:
 * ReconJob (recon_jobs) or ReconciliationRun (reconciliation_runs). This is not
 * ReconciliationMatch adjudication (/jobs/.../exceptions/...).
 */

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { reconciliationRunStatusToBadgeType } from "@/lib/console/run-display";

export interface ExceptionDetailProvenanceRun {
  id: string;
  runKind: "recon_job" | "ingestion_run";
  sourceModel: "recon_jobs" | "reconciliation_runs";
  name: string | null;
  normalizedStatus: string;
  statusLabel: string;
  createdAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  ingestionId: string | null;
  reconJobId: string | null;
  href: string;
  recordFound: boolean;
  latestResultId: string | null;
  uuidCollision: boolean;
  collision?: { reconJobId: string; reconciliationRunId: string };
}

function formatTs(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleString();
}

function runKindLabel(kind: ExceptionDetailProvenanceRun["runKind"]): string {
  return kind === "recon_job" ? "Reconciliation job" : "Ingestion reconciliation run";
}

export function ExceptionDetailRunContext({ run }: { run: ExceptionDetailProvenanceRun | null }) {
  if (!run) {
    return (
      <div className="rounded-md border border-border bg-muted/15 px-3 py-3 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Run context</p>
        <p className="mt-1 text-xs">
          No run is linked to this drift exception. Run context is unavailable.
        </p>
      </div>
    );
  }

  if (run.uuidCollision && run.collision) {
    return (
      <div className="rounded-md border border-amber-500/40 bg-amber-500/5 px-3 py-3 text-sm">
        <p className="font-medium text-foreground">Ambiguous run id</p>
        <p className="mt-1 text-xs text-muted-foreground">
          The same UUID exists as both a reconciliation job and an ingestion run in this workspace.
          Open the correct record from Operations; do not assume a single run row.
        </p>
        <div className="mt-2 space-y-1 text-xs font-mono text-muted-foreground">
          <p>recon_jobs.id: {run.collision.reconJobId}</p>
          <p>reconciliation_runs.id: {run.collision.reconciliationRunId}</p>
        </div>
      </div>
    );
  }

  const badgeType = reconciliationRunStatusToBadgeType(run.normalizedStatus);

  return (
    <div className="rounded-md border border-border bg-muted/15 px-3 py-3 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {runKindLabel(run.runKind)} (source of exception)
          </p>
          {run.recordFound ? (
            <>
              <p className="text-sm font-semibold text-foreground break-words">
                {run.name?.trim() ? run.name.trim() : "Unnamed run"}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <StatusBadge status={badgeType} label={run.statusLabel} size="sm" showIcon />
              </div>
              <p className="text-[11px] text-muted-foreground pt-0.5">
                Model:{" "}
                <span className="font-mono">
                  {run.sourceModel === "recon_jobs" ? "recon_jobs" : "reconciliation_runs"}
                </span>
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Run record not found for this workspace. The linked id may be stale or was removed.
            </p>
          )}
        </div>
        <Link
          href={run.href}
          className="shrink-0 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
        >
          Open in console
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      <div className="text-xs text-muted-foreground space-y-1 border-t border-border pt-2">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span>
            Run id:{" "}
            <code className="bg-muted/50 px-1 py-0.5 rounded font-mono text-[11px]">{run.id}</code>
          </span>
        </div>
        {run.recordFound && run.latestResultId && (
          <p>
            Latest result id:{" "}
            <code className="bg-muted/50 px-1 py-0.5 rounded font-mono text-[11px]">
              {run.latestResultId}
            </code>
          </p>
        )}
        {run.recordFound &&
          (formatTs(run.startedAt) || formatTs(run.completedAt) || formatTs(run.createdAt)) && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
              {formatTs(run.createdAt) && <span>Created: {formatTs(run.createdAt)}</span>}
              {formatTs(run.startedAt) && <span>Started: {formatTs(run.startedAt)}</span>}
              {formatTs(run.completedAt) && <span>Completed: {formatTs(run.completedAt)}</span>}
            </div>
          )}
        {run.recordFound && run.ingestionId && (
          <p className="pt-1">
            Ingestion:{" "}
            <Link
              href={`/console/ingestion/${run.ingestionId}`}
              className="text-blue-600 hover:underline dark:text-blue-400 font-mono text-[11px]"
            >
              {run.ingestionId}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
