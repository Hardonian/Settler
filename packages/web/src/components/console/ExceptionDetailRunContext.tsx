"use client";

/**
 * Reconciliation run context for a DriftEvent (console exception detail).
 *
 * DriftEvent.reconJobId references ReconciliationRun.id — it is the run UUID, not a
 * batch/workflow job id. Match adjudication lives on /jobs/.../exceptions/... and
 * must not be conflated with this drift workflow surface.
 */

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { reconciliationRunStatusToBadgeType } from "@/lib/console/run-display";

export interface ExceptionDetailProvenanceRun {
  id: string;
  name: string | null;
  status: string | null;
  createdAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  ingestionId: string | null;
  href: string;
  /** False when DriftEvent.reconJobId is set but no ReconciliationRun row exists for this tenant. */
  recordFound: boolean;
}

function formatTs(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleString();
}

export function ExceptionDetailRunContext({ run }: { run: ExceptionDetailProvenanceRun | null }) {
  if (!run) {
    return (
      <div className="rounded-md border border-border bg-muted/15 px-3 py-3 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Reconciliation run</p>
        <p className="mt-1 text-xs">
          No reconciliation run is linked to this drift exception. Run context is unavailable.
        </p>
      </div>
    );
  }

  const badgeType = reconciliationRunStatusToBadgeType(run.status ?? undefined);

  return (
    <div className="rounded-md border border-border bg-muted/15 px-3 py-3 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Reconciliation run (source of exception)
          </p>
          {run.recordFound ? (
            <>
              <p className="text-sm font-semibold text-foreground break-words">
                {run.name?.trim() ? run.name.trim() : "Unnamed run"}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                {run.status ? (
                  <StatusBadge
                    status={badgeType}
                    label={run.status}
                    size="sm"
                    showIcon
                  />
                ) : (
                  <Badge variant="outline" className="text-xs font-normal">
                    Run status unavailable
                  </Badge>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Run record not found for this workspace. The linked run id may be stale or was
              removed.
            </p>
          )}
        </div>
        <Link
          href={run.href}
          className="shrink-0 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
        >
          Open run
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
            Ingestion id:{" "}
            <code className="bg-muted/50 px-1 py-0.5 rounded font-mono text-[11px]">
              {run.ingestionId}
            </code>
          </p>
        )}
      </div>
    </div>
  );
}
