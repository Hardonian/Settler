"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Settings,
  Shield,
  BarChart3,
  History,
  RotateCcw,
  Zap,
  Loader2,
  Activity,
  FileDown,
} from "lucide-react";

import {
  Button,
  Card,
  CardContent,
  CardTitle,
  CardDescription,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";

import { FreezeBlockedButton } from "@/components/shared/FreezeBlockedButton";
import { FreezeErrorAlert } from "@/components/shared/FreezeErrorAlert";
import { useGovernanceState } from "@/hooks/use-governance-state";
import {
  getApiErrorMessage,
  getGovernanceRecoveryHref,
  parseGovernanceFreezeError,
  type GovernanceFreezeErrorDetails,
} from "@/lib/governance/freeze-client";
import type { OperatorRunDetail } from "@/types/operator-run-detail";
import { formatDistanceToNow } from "date-fns";
import {
  getOperatorRunDetailProvenanceSignals,
  parseOperatorRunDetailResponse,
} from "@/lib/runs/operator-run-detail";

// Extracted Components
import { RunStages } from "./components/RunStages";
import { RunConfiguration } from "./components/RunConfiguration";
import { RunStatistics } from "./components/RunStatistics";
import { RunProvenance } from "./components/RunProvenance";
import { RunOperatorTruthPanel } from "./components/RunOperatorTruthPanel";

export default function RunPage() {
  const params = useParams();
  const router = useRouter();
  const runId = Array.isArray(params.runId) ? params.runId[0] : params.runId;
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [freezeError, setFreezeError] = useState<GovernanceFreezeErrorDetails | null>(null);
  const { isFrozen, governanceState } = useGovernanceState();

  // Use React Query for efficient fetching, polling, and data synchronization
  const {
    data: run,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery<OperatorRunDetail>({
    queryKey: ["runs", runId],
    queryFn: async () => {
      const response = await fetch(`/api/runs/${runId}`);
      if (!response.ok) {
        throw new Error(`Failed to load run detail: ${response.statusText}`);
      }
      return parseOperatorRunDetailResponse(await response.json());
    },
    // Only poll every 2 seconds if the job is not in a terminal state
    refetchInterval: (query) =>
      query.state.data && !query.state.data.isTerminal && autoRefresh ? 2000 : false,
    staleTime: 5000,
  });

  const handleRetry = useCallback(async () => {
    if (!run) return;
    try {
      setActionError(null);
      setFreezeError(null);
      const response = await fetch(`/api/runs/${runId}/retry`, { method: "POST" });
      const payload = (await response.json().catch(() => null)) as unknown;
      const freezeDetails = parseGovernanceFreezeError(payload, response.status);

      if (freezeDetails) {
        setFreezeError(freezeDetails);
        return;
      }

      if (!response.ok) {
        setActionError(getApiErrorMessage(payload, "Failed to retry run"));
        return;
      }

      const nextRunId =
        payload && typeof payload === "object" && "data" in payload
          ? (payload as { data?: { id?: string } }).data?.id
          : undefined;

      if (typeof nextRunId === "string" && nextRunId.length > 0) {
        router.push(`/console/runs/${nextRunId}`);
        return;
      }

      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to retry run");
    }
  }, [router, runId, run, refetch]);

  const handleExport = useCallback(async () => {
    if (!runId) return;
    setExporting(true);
    setActionError(null);
    setFreezeError(null);
    try {
      const response = await fetch("/api/exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "csv",
          format: "all",
          reconciliationRunId: runId,
        }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as unknown;
        const freezeDetails = parseGovernanceFreezeError(payload, response.status);

        if (freezeDetails) {
          setFreezeError(freezeDetails);
          return;
        }

        const body =
          payload && typeof payload === "object"
            ? (payload as { capability?: { reason?: string } })
            : null;
        setActionError(body?.capability?.reason ?? getApiErrorMessage(payload, "Export failed"));
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `run-${runId.slice(0, 8)}-results.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }, [runId]);

  if (isLoading) {
    return (
      <div className="p-8 space-y-8 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-xl" />
          ))}
        </div>
        <div className="h-96 bg-muted rounded-xl" />
      </div>
    );
  }

  if (isError || !run) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-4">
        <div className="p-4 rounded-full bg-red-500/10 text-red-500">
          <AlertCircle className="w-12 h-12" />
        </div>
        <CardTitle className="text-2xl">Run detail unavailable</CardTitle>
        <CardDescription className="max-w-md mx-auto">
          {error instanceof Error
            ? error.message
            : "The requested run detail could not be loaded. This may be due to a transient network issue or an invalid run ID."}
        </CardDescription>
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
          <Button onClick={() => refetch()}>Retry Connection</Button>
        </div>
      </div>
    );
  }

  const provenanceSignals = getOperatorRunDetailProvenanceSignals(run);
  const showResultsLink = run.status === "completed" && run.runKind !== "ingestion_run";
  const showRunExceptionsLink = run.exceptions.total > 0;
  const activeFreezeDetails =
    freezeError ??
    (isFrozen
      ? {
          message: "Write actions are currently blocked by tenant freeze.",
          reason: governanceState?.freeze_reason ?? null,
          frozenAt: governanceState?.frozen_at ?? null,
          traceId: null,
        }
      : null);

  return (
    <div className="p-6 lg:p-10 space-y-10 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative group">
        <div className="space-y-4">
          <Button asChild variant="ghost" size="sm" className="group/back -ml-3">
            <Link
              href="/console/runs"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover/back:-translate-x-1" />
              Back to Runs
            </Link>
          </Button>
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
                <Shield className="w-6 h-6" />
              </div>
              <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">
                {run.name}
              </h1>
            </div>
            <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest pl-11">
              UUID: {run.id} • Initiated {formatDistanceToNow(new Date(run.startedAt))} ago
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className={`transition-all ${autoRefresh ? "bg-green-500/5 text-green-600 border-green-500/20" : ""}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className={`w-4 h-4 mr-2 ${autoRefresh ? "animate-pulse" : ""}`} />
            {autoRefresh ? "Auto-Refresh Active" : "Auto-Refresh Paused"}
          </FreezeBlockedButton>
          <FreezeBlockedButton
            variant="outline"
            disabled={!run.isTerminal || exporting}
            onClick={() => void handleExport()}
            isFrozen={isFrozen}
            freezeReason={governanceState?.freeze_reason}
            frozenMessage="Exporting run results is blocked by tenant freeze"
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4 mr-2" />
            )}
            {exporting ? "Exporting…" : "Export results"}
          </Button>
          <FreezeBlockedButton
            className="bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20"
            disabled={!run.isTerminal}
            onClick={handleRetry}
            isFrozen={isFrozen}
            freezeReason={governanceState?.freeze_reason}
            frozenMessage="Retrying a run is blocked by tenant freeze"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Retry run
          </FreezeBlockedButton>
        </div>
      </div>

      {activeFreezeDetails ? (
        <FreezeErrorAlert
          reason={activeFreezeDetails.reason}
          frozenAt={activeFreezeDetails.frozenAt ?? undefined}
          recoveryAction={{
            label: "Open Governance Controls",
            href: getGovernanceRecoveryHref(),
          }}
        />
      ) : null}

      {actionError ? (
        <Card className="border-red-200 bg-red-50/60 dark:border-red-900/60 dark:bg-red-950/20">
          <CardContent className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                Action could not be completed
              </p>
              <p className="mt-1 text-sm text-red-700/90 dark:text-red-300/90">{actionError}</p>
            </div>
            <Button variant="outline" onClick={() => setActionError(null)}>
              Dismiss
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border/60 bg-muted/20">
        <CardContent className="flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Workflow Continuity
            </p>
            <p className="text-sm font-medium text-foreground">
              Move from execution truth to outcome review without losing run context.
            </p>
            <p className="text-sm text-muted-foreground">
              Use the links below to inspect results, work run-scoped exceptions, or confirm
              governance state before retrying mutations.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {showResultsLink ? (
              <Button asChild>
                <Link href={`/console/reconciliations?runId=${run.id}`}>
                  Inspect results
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : null}
            {showRunExceptionsLink ? (
              <Button asChild variant="outline">
                <Link href={`/console/exceptions?runId=${run.id}&runKind=${run.runKind}`}>
                  Review exceptions
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href={getGovernanceRecoveryHref()}>
                Governance controls
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <DetailCard
          label="Operational State"
          value={run.status.toUpperCase()}
          subtext={run.isTerminal ? "Terminal" : "In progress"}
          status={run.status}
        />
        <DetailCard
          label="Throughput"
          value={run.summary.total.toLocaleString()}
          subtext="Total Transactions"
          icon={Zap}
        />
        <DetailCard
          label="Variance Rate"
          value={`${Math.round((run.summary.unmatched / (run.summary.total || 1)) * 100)}%`}
          subtext="Exception Density"
          icon={BarChart3}
        />
        <DetailCard
          label="Proof signal"
          value={run.compactProofSummary.operatorSummary.signal.replace(/_/g, " ").toUpperCase()}
          subtext={
            run.compactProofSummary.operatorSummary.proofPosture !== "unavailable"
              ? `Evidence posture: ${run.compactProofSummary.operatorSummary.proofPosture.replace(/_/g, " ")}`
              : "Evidence posture unavailable for this run"
          }
          icon={Shield}
        />
      </div>

      {run.proofpackIndex ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DetailCard
            label="Comparable history"
            value={run.proofpackIndex.comparison.history.trend.replace(/_/g, " ").toUpperCase()}
            subtext={run.proofpackIndex.comparison.history.summary}
          />
          <DetailCard
            label="Recurring exception families"
            value={run.proofpackIndex.recurrence.topRecurringFamilies.length.toLocaleString()}
            subtext={
              run.proofpackIndex.recurrence.topRecurringFamilies[0]
                ? `Largest cluster: ${run.proofpackIndex.recurrence.topRecurringFamilies[0].family}`
                : "No ranked families in index window"
            }
          />
          <DetailCard
            label="Proof package coverage"
            value={`${run.proofpackIndex.proofPackages.finalized}/${run.proofpackIndex.proofPackages.total}`}
            subtext={`${run.proofpackIndex.proofPackages.state.replace(/_/g, " ")}${run.proofpackIndex.proofPackages.missingEvidenceCount > 0 ? ` · ${run.proofpackIndex.proofPackages.missingEvidenceCount} missing evidence` : ""}`}
          />
        </div>
      ) : null}

      <RunOperatorTruthPanel run={run} />

      <Tabs defaultValue="statistics" className="w-full">
        <div className="flex items-center justify-between border-b border-border/40 pb-px mb-8 sticky top-0 bg-background/80 backdrop-blur-xl z-20">
          <TabsList className="bg-transparent h-12 p-0 gap-8">
            <TabTrigger value="statistics" label="Statistics" icon={BarChart3} />
            <TabTrigger value="stages" label="Stages" icon={History} />
            <TabTrigger value="config" label="Configuration" icon={Settings} />
            <TabTrigger value="provenance" label="Proof & Provenance" icon={Shield} />
          </TabsList>
          {isRefetching && (
            <div className="flex items-center gap-2 pr-4 text-[10px] font-mono font-bold text-muted-foreground animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              SYNCING
            </div>
          )}
        </div>

        <TabsContent value="statistics" className="mt-0 focus-visible:outline-none ring-0">
          <RunStatistics
            summary={run.summary}
            runDelta={run.runDelta}
            configDrift={run.configDrift}
            compactProofSummary={run.compactProofSummary}
          />
        </TabsContent>

        <TabsContent value="stages" className="mt-0 focus-visible:outline-none ring-0">
          <RunStages stages={run.stages} />
        </TabsContent>

        <TabsContent value="config" className="mt-0 focus-visible:outline-none ring-0">
          <RunConfiguration config={run.config} configDrift={run.configDrift} />
        </TabsContent>

        <TabsContent value="provenance" className="mt-0 focus-visible:outline-none ring-0">
          <RunProvenance
            provenance={run.provenance}
            metadata={run.metadata}
            traceId={provenanceSignals.traceId}
            inputHash={provenanceSignals.inputHash}
            runId={runId ?? undefined}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DetailCard({ label, value, subtext, status, icon: Icon }: any) {
  const getStatusColor = (s: string) => {
    switch (s) {
      case "completed":
        return "text-green-500 bg-green-500/10 border-green-500/20";
      case "failed":
        return "text-red-500 bg-red-500/10 border-red-500/20";
      case "running":
        return "text-blue-500 bg-blue-500/10 border-blue-500/20 animate-pulse";
      default:
        return "text-muted-foreground bg-muted/50 border-muted/20";
    }
  };

  return (
    <div
      className={`p-4 rounded-2xl border transition-all duration-300 hover:shadow-xl ${status ? getStatusColor(status) : "bg-card hover:border-blue-500/30"}`}
    >
      <div className="flex flex-col h-full justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-2">{label}</p>
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-black tracking-tighter">{value}</h3>
            {Icon && <Icon className="w-4 h-4 opacity-40 ml-auto" />}
          </div>
        </div>
        <p className="text-[10px] font-mono mt-2 opacity-60 uppercase">{subtext}</p>
      </div>
    </div>
  );
}

function TabTrigger({ value, label, icon: Icon }: any) {
  return (
    <TabsTrigger
      value={value}
      className="relative h-12 rounded-none border-b-2 border-transparent bg-transparent px-2 pb-3 pt-2 font-bold text-muted-foreground transition-all duration-300 hover:text-foreground data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
    </TabsTrigger>
  );
}
