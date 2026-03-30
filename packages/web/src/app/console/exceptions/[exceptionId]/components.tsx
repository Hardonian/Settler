"use client";

import { useQuery } from "@tanstack/react-query";
import { safeFetch } from "@/lib/safe-fetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { EvidenceTrustCard } from "@/components/proof/EvidenceTrustCard";

// Memories
export function Memories({ exceptionId }: { exceptionId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["exception-memories", exceptionId],
    queryFn: async () => {
      const result = await safeFetch<{ data: any[] }>(`/api/exceptions/${exceptionId}/memories`);
      if (!result.success) throw new Error(result.error?.message);
      return result.data;
    },
  });

  if (isLoading) return <Skeleton className="h-48" />;
  if (error) return <ErrorState title="Failed to load memories" message={error.message} />;
  if (!data || data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Adjudication Memory</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((memory) => (
            <div key={memory.id} className="rounded-lg border border-border bg-muted/10 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">
                  {memory.resolution}
                </Badge>
                {memory.outcome ? (
                  <Badge className="bg-muted/40 text-foreground dark:bg-background dark:text-muted-foreground">
                    {memory.outcome}
                  </Badge>
                ) : null}
                <Badge variant="outline" className="text-xs">
                  {memory.adjudicationType}
                </Badge>
                {memory.sourceTrustScore != null ? (
                  <Badge variant="outline" className="text-xs">
                    Source trust {(memory.sourceTrustScore * 100).toFixed(0)}%
                  </Badge>
                ) : null}
              </div>
              <p className="mt-2 text-sm">
                {memory.resolutionReason ?? "No structured resolution reason recorded."}
              </p>
              {memory.operatorNotes ? (
                <p className="mt-2 text-sm text-muted-foreground">{memory.operatorNotes}</p>
              ) : null}
              {memory.systemNotes ? (
                <p className="mt-2 text-xs text-muted-foreground">{memory.systemNotes}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>Actor: {memory.adjudicatorId}</span>
                <span>
                  Recorded {new Date(memory.completedAt ?? memory.createdAt).toLocaleString()}
                </span>
                <span>Evidence refs: {memory.evidenceIds.length}</span>
                {memory.parentMemoryId ? <span>Reopened from prior decision</span> : null}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Evidence
export function Evidence({ exceptionId }: { exceptionId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["exception-evidence", exceptionId],
    queryFn: async () => {
      const result = await safeFetch<{ data: any[] }>(`/api/exceptions/${exceptionId}/evidence`);
      if (!result.success) throw new Error(result.error?.message);
      return result.data;
    },
  });

  if (isLoading) return <Skeleton className="h-48" />;
  if (error) return <ErrorState title="Failed to load evidence" message={error.message} />;
  if (!data || data.length === 0) return null;

  const summary = {
    total: data.length,
    degraded: data.filter((item) => item.degraded).length,
    attested: data.filter((item) => item.attested).length,
    latestCapturedAt: data[0]?.capturedAt,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Evidence &amp; Proof Readiness</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Evidence artifacts
            </p>
            <p className="mt-2 text-2xl font-bold">{summary.total}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {summary.attested} attested, {summary.degraded} degraded
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            {/* This will be populated by the proofs component */}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Proofs
export function Proofs({ exceptionId }: { exceptionId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["exception-proofs", exceptionId],
    queryFn: async () => {
      const result = await safeFetch<{ data: any[] }>(`/api/exceptions/${exceptionId}/proofs`);
      if (!result.success) throw new Error(result.error?.message);
      return result.data;
    },
  });

  if (isLoading) return <Skeleton className="h-24" />;
  if (error) return <ErrorState title="Failed to load proofs" message={error.message} />;
  if (!data || data.length === 0) return null;

  const summary = {
    total: data.length,
    finalized: data.filter((item) => item.status === "finalized").length,
  };

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">Proof packages</p>
      <p className="mt-2 text-2xl font-bold">{summary.total}</p>
      <p className="mt-1 text-xs text-muted-foreground">{summary.finalized} finalized</p>
    </div>
  );
}

// Provenance
export function Provenance({ exceptionId }: { exceptionId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["exception-provenance", exceptionId],
    queryFn: async () => {
      const result = await safeFetch<{ data: any[] }>(`/api/exceptions/${exceptionId}/provenance`);
      if (!result.success) throw new Error(result.error?.message);
      return result.data;
    },
  });

  if (isLoading) return <Skeleton className="h-48" />;
  if (error) return <ErrorState title="Failed to load provenance" message={error.message} />;
  if (!data || data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Activity &amp; Audit Trail</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((entry, index) => (
            <div key={index} className="border-l-2 border-border dark:border-border pl-4">
              <div className="flex items-start gap-3">
                <div className="shrink-0 text-xs text-muted-foreground dark:text-muted-foreground">
                  {new Date(entry.createdAt).toLocaleString()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground dark:text-white">
                      {entry.eventType}
                    </span>
                    <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                      by {entry.actorType}
                    </span>
                  </div>
                  {entry.details && (
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-0.5">
                      {JSON.stringify(entry.details)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
