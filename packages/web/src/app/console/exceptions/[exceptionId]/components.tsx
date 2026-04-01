"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { safeFetch } from "@/lib/safe-fetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge, type StatusType } from "@/components/ui/status-badge";
import { ChevronDown, ChevronRight, History, Info, ShieldCheck, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types ---

interface ExceptionDetail {
  id: string;
  type: string;
  status: string;
  severity: string;
  detectedAt: string;
  description: string;
  amount?: number;
  currency?: string;
  sourceTransactionId?: string;
}

export type { ExceptionDetail };

// --- Components ---

/**
 * SeverityBadge - Status-aware badge for exception priority
 */
export function SeverityBadge({ severity, className }: { severity: string; className?: string }) {
  const variantMap: Record<string, "destructive" | "warning" | "outline" | "secondary"> = {
    critical: "destructive",
    high: "warning",
    medium: "outline",
    low: "secondary",
  };

  const variant = variantMap[severity.toLowerCase()] || "outline";

  return (
    <Badge variant={variant} className={cn("capitalize", className)}>
      {severity}
    </Badge>
  );
}

/**
 * Base status to StatusType mapping
 */
function mapStatusToType(status: string): StatusType {
  const s = status.toLowerCase();
  if (s === "resolved" || s === "matched") return "completed";
  if (s === "ignored" || s === "dismissed") return "disabled";
  if (s === "investigating" || s === "in_progress") return "in_progress";
  return "pending";
}

/**
 * StatusBadge (Exported Wrapper)
 */
export function GenericStatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <StatusBadge
      status={mapStatusToType(status)}
      label={status.replace(/_/g, " ")}
      className={className}
    />
  );
}

export { GenericStatusBadge as StatusBadge };

/**
 * CollapsibleJson - For inspecting raw record and metadata
 */
export function CollapsibleJson({
  title,
  data,
  expandedDefault = false,
}: {
  title: string;
  data: any;
  expandedDefault?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(expandedDefault);

  if (!data) return null;

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between bg-muted/30 px-4 py-2 hover:bg-muted/50 transition-colors"
      >
        <span className="text-sm font-medium">{title}</span>
        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {isExpanded && (
        <div className="bg-background p-4 overflow-auto max-h-[400px]">
          <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

/**
 * ProvenanceRow - Individual record in the activity trail
 */
export function ProvenanceRow({ entry }: { entry: any }) {
  return (
    <div className="relative pl-6 pb-6 last:pb-0">
      <div className="absolute left-0 top-1 bottom-0 w-px bg-border group-last:bg-transparent" />
      <div className="absolute left-[-4px] top-1.5 h-2 w-2 rounded-full border border-background bg-primary" />
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{entry.eventType.replace(/_/g, " ")}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(entry.createdAt).toLocaleString()}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          by <span className="text-foreground/80">{entry.actorType}</span>
          {entry.actorUserId ? ` (${entry.actorUserId.slice(0, 8)})` : ""}
        </div>
        {entry.details && (
          <div className="mt-2 rounded bg-muted/40 p-2 text-xs font-mono">
            {typeof entry.details === "string" ? entry.details : JSON.stringify(entry.details)}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ExceptionDetailClient - Hub for interactive adjudication
 */
export function ExceptionDetailClient({ exceptionId }: { exceptionId: string }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Primary Context Column */}
      <div className="lg:col-span-2 space-y-6">
        <Memories exceptionId={exceptionId} />
        <Provenance exceptionId={exceptionId} />
      </div>

      {/* Side Intelligence Column */}
      <div className="space-y-6">
        <Evidence exceptionId={exceptionId} />
        <Proofs exceptionId={exceptionId} />
      </div>
    </div>
  );
}

// Memories
export function Memories({ exceptionId }: { exceptionId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["exception-memories", exceptionId],
    queryFn: async () => {
      const result = await safeFetch<{ data: any[] }>(`/api/exceptions/${exceptionId}/memories`);
      if (!result.success || !result.data) throw new Error(result.error?.message || "Data missing");
      return result.data.data;
    },
  });

  if (isLoading) return <Skeleton className="h-48" />;
  if (error) return <ErrorState title="Failed to load memories" message={error.message} />;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Adjudication Memory
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!data || data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground italic text-sm border-2 border-dashed rounded-lg">
            No durable records for this exception yet. Actions will be logged here.
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((memory) => (
              <div
                key={memory.id}
                className="rounded-lg border border-border bg-muted/10 p-4 transition-all hover:bg-muted/20"
              >
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant="outline" className="font-mono text-xs bg-background">
                    {memory.resolution.toUpperCase()}
                  </Badge>
                  {memory.outcome && (
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      {memory.outcome}
                    </Badge>
                  )}
                  <SeverityBadge severity={memory.adjudicationType} className="text-xs" />
                  {memory.sourceTrustScore != null && (
                    <Badge variant="outline" className="text-xs">
                      <ShieldCheck className="mr-1 h-3 w-3 inline" />
                      {(memory.sourceTrustScore * 100).toFixed(0)}% Trust
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-medium">
                  {memory.resolutionReason ?? "General adjudication outcome."}
                </p>
                {memory.operatorNotes && (
                  <div className="mt-2 text-sm text-muted-foreground border-l-2 border-primary/30 pl-3 italic">
                    {memory.operatorNotes}
                  </div>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Actor: {memory.adjudicatorId.slice(0, 8)}
                    <span className="mx-1 opacity-50">|</span>
                    Type: {memory.adjudicatorType}
                  </span>
                  <span>{new Date(memory.completedAt ?? memory.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
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
      if (!result.success || !result.data) throw new Error(result.error?.message || "Data missing");
      return result.data.data;
    },
  });

  if (isLoading) return <Skeleton className="h-32" />;
  if (error) return <ErrorState title="Failed to load evidence" message={error.message} />;

  const count = data?.length || 0;
  const attested = data?.filter((e) => e.attested).length || 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/30 border-b">
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Evidence Status
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-3xl font-bold">{count}</div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-tight">
              Artifacts
            </div>
            <div className="text-[10px] text-green-600 font-semibold">{attested} attested</div>
          </div>
        </div>
        <div className="space-y-2">
          {data?.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0"
            >
              <span className="truncate max-w-[120px] font-mono opacity-80">
                {item.artifactType}
              </span>
              <Badge
                variant={item.degraded ? "destructive" : "outline"}
                className="scale-75 origin-right"
              >
                {item.degraded ? "degraded" : "ready"}
              </Badge>
            </div>
          ))}
          {count > 3 && (
            <div className="text-[10px] text-center text-muted-foreground pt-1">
              +{count - 3} more available
            </div>
          )}
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
      if (!result.success || !result.data) throw new Error(result.error?.message || "Data missing");
      return result.data.data;
    },
  });

  if (isLoading) return <Skeleton className="h-32" />;
  if (error) return <ErrorState title="Failed to load proofs" message={error.message} />;

  const ready = data?.some((p) => p.status === "finalized");

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Proof Readiness
        </CardTitle>
      </CardHeader>
      <CardContent>
        {ready ? (
          <div className="flex flex-col items-center py-2">
            <div className="text-sm font-semibold text-primary mb-1">Finalized & Exportable</div>
            <p className="text-[10px] text-muted-foreground text-center">
              Consolidated evidence pack matches ledger truth.
            </p>
          </div>
        ) : (
          <div className="text-center py-4 text-xs text-muted-foreground italic">
            Gathering requisite artifacts...
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Provenance
export function Provenance({ exceptionId }: { exceptionId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["exception-provenance", exceptionId],
    queryFn: async () => {
      const result = await safeFetch<{ data: any[] }>(`/api/exceptions/${exceptionId}/provenance`);
      if (!result.success || !result.data) throw new Error(result.error?.message || "Data missing");
      return result.data.data;
    },
  });

  if (isLoading) return <Skeleton className="h-64" />;
  if (error) return <ErrorState title="Failed to load provenance" message={error.message} />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Provenance Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mt-4">
          {!data || data.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm opacity-60 italic">
              Tracing system origins...
            </div>
          ) : (
            <div className="group">
              {data.map((entry) => (
                <ProvenanceRow key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
