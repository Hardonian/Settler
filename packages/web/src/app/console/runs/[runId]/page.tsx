"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
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
  CardTitle,
  CardDescription,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";

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

export default function RunPage() {
  const params = useParams();
  const router = useRouter();
  const runId = Array.isArray(params.runId) ? params.runId[0] : params.runId;
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [exporting, setExporting] = useState(false);

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
      const response = await fetch(`/api/runs/${runId}/retry`, { method: "POST" });
      if (response.ok) {
        refetch();
      }
    } catch (err) {
      console.error("Retry failed:", err);
    }
  }, [runId, run, refetch]);

  const handleExport = useCallback(async () => {
    if (!runId) return;
    setExporting(true);
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
        const body = await response.json().catch(() => ({}));
        const cap = (body as { capability?: { reason?: string } }).capability;
        console.error("Export failed:", cap?.reason ?? response.statusText);
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
      console.error("Export error:", err);
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

  return (
    <div className="p-6 lg:p-10 space-y-10 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative group">
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            className="group/back -ml-3 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover/back:-translate-x-1 transition-transform" />
            Back to Dashboard
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
          </Button>
          <Button
            variant="outline"
            disabled={!run.isTerminal || exporting}
            onClick={() => void handleExport()}
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4 mr-2" />
            )}
            {exporting ? "Exporting…" : "Export results"}
          </Button>
          <Button
            className="bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20"
            disabled={!run.isTerminal}
            onClick={handleRetry}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Retry run
          </Button>
        </div>
      </div>

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
              ? `Posture ${run.compactProofSummary.operatorSummary.proofPosture}`
              : "Posture unavailable"
          }
          icon={Shield}
        />
      </div>

      {run.proofpackIndex ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DetailCard
            label="History Trend"
            value={run.proofpackIndex.comparison.history.trend.toUpperCase()}
            subtext={`certainty ${run.proofpackIndex.comparison.history.certainty}`}
          />
          <DetailCard
            label="Recurring Families"
            value={run.proofpackIndex.recurrence.topRecurringFamilies.length.toString()}
            subtext={
              run.proofpackIndex.recurrence.topRecurringFamilies[0]
                ? `top ${run.proofpackIndex.recurrence.topRecurringFamilies[0].family}`
                : "No ranked families yet"
            }
          />
          <DetailCard
            label="Proof Coverage"
            value={`${run.proofpackIndex.proofPackages.finalized}/${run.proofpackIndex.proofPackages.total}`}
            subtext={run.proofpackIndex.proofPackages.state}
          />
        </div>
      ) : null}

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
          <RunStatistics summary={run.summary} runDelta={run.runDelta} />
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
