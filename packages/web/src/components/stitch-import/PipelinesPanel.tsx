"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  MoreVertical,
  ArrowRightCircle,
  Webhook,
  Terminal,
  AlertTriangle,
  PauseCircle,
  Play,
  Bug,
  Hammer,
  Globe,
  Shuffle,
  LogOut,
  GitCommit,
  Filter,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ReasonForChangeDialog } from "@/components/shared/ReasonForChangeDialog";

const pipelines = [
  {
    id: "payment-recon-v2",
    name: "payment_reconciliation_v2",
    status: "Healthy",
    lastRun: "2m ago",
    input: "Stripe Connect",
    output: "S3: settled-trans",
    errorTrend: [10, 15, 10, 10, 5, 12, 8],
    latency: "245ms",
    throughput: "45k/s",
    version: "v1.4.2",
  },
  {
    id: "ledger-sync-daily",
    name: "ledger_sync_daily",
    status: "Critical",
    lastRun: "15m ago",
    input: "Postgres DB",
    output: "Internal API",
    errorTrend: [18, 18, 10, 5, 15, 2],
    isCritical: true,
  },
  {
    id: "fraud-detection-stream",
    name: "fraud_detection_stream",
    status: "Paused",
    lastRun: "4h ago",
    version: "v1.2.0",
  },
  {
    id: "inventory-aggregator",
    name: "inventory_aggregator",
    status: "Degraded",
    lastRun: "5m ago",
    errorTrend: [15, 15, 10, 12, 5, 8],
  },
];

export function PipelinesPanel() {
  const [selectedPipeline, setSelectedPipeline] = useState<(typeof pipelines)[0] | null>(null);
  const [isReasonDialogOpen, setIsReasonDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const handleAction = (action: string) => {
    setPendingAction(action);
    setIsReasonDialogOpen(true);
  };

  const confirmAction = (reason: string) => {
    console.warn(`Action ${pendingAction} executed with reason: ${reason}`);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Pipelines
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Monitor and control your data processing pipelines.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="rounded-full">
              <RefreshCw className="w-5 h-5 text-slate-500" />
            </Button>
            <Button className="rounded-full w-12 h-12 p-0 shadow-lg shadow-primary-600/20">
              <Plus className="w-6 h-6" />
            </Button>
          </div>
        </div>

        <button className="flex w-full items-center justify-between rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm group hover:border-primary-500/50 transition-all">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
              <Globe className="w-6 h-6" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Active Workspace
              </span>
              <span className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                Production - US East
              </span>
            </div>
          </div>
          <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-primary-500" />
        </button>

        <div className="flex gap-10 px-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              Active
            </span>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">12</span>
          </div>
          <div className="w-[1px] h-10 bg-slate-200 dark:bg-slate-800" />
          <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              Error Rate
            </span>
            <span className="text-2xl font-bold text-red-500">0.4%</span>
          </div>
          <div className="w-[1px] h-10 bg-slate-200 dark:bg-slate-800" />
          <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              Throughput
            </span>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">45k/s</span>
          </div>
        </div>
      </header>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            className="pl-10 h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl"
            placeholder="Search pipelines..."
          />
        </div>
        <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl">
          <Filter className="w-5 h-5 text-slate-500" />
        </Button>
      </div>

      <div className="space-y-4">
        {pipelines.map((pipe) => (
          <Card
            key={pipe.id}
            className={cn(
              "p-5 relative overflow-hidden group hover:border-primary-500/50 transition-all cursor-pointer",
              pipe.status === "Critical" && "border-red-200 dark:border-red-900/50 bg-red-50/10",
              pipe.status === "Paused" && "opacity-70 grayscale-[0.5]"
            )}
            onClick={() => setSelectedPipeline(pipe)}
          >
            {pipe.status === "Critical" && (
              <div className="absolute inset-y-0 left-0 w-1 bg-red-600" />
            )}

            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "relative flex h-12 w-12 items-center justify-center rounded-xl",
                    pipe.status === "Healthy"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : pipe.status === "Critical"
                        ? "bg-red-500/10 text-red-500"
                        : pipe.status === "Paused"
                          ? "bg-slate-500/10 text-slate-500"
                          : "bg-yellow-500/10 text-yellow-500"
                  )}
                >
                  {pipe.status === "Healthy" ? (
                    <RefreshCw className="w-6 h-6" />
                  ) : pipe.status === "Critical" ? (
                    <AlertTriangle className="w-6 h-6" />
                  ) : pipe.status === "Paused" ? (
                    <PauseCircle className="w-6 h-6" />
                  ) : (
                    <Bug className="w-6 h-6" />
                  )}
                  {pipe.status === "Healthy" && (
                    <span className="absolute -right-1 -top-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">
                    {pipe.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant={
                        pipe.status === "Healthy"
                          ? "success"
                          : pipe.status === "Critical"
                            ? "destructive"
                            : pipe.status === "Paused"
                              ? "secondary"
                              : "warning"
                      }
                    >
                      {pipe.status}
                    </Badge>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      • {pipe.lastRun}
                    </span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-slate-400">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </div>

            {pipe.status !== "Paused" && (
              <>
                <div className="grid grid-cols-2 gap-6 mb-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Input
                    </span>
                    <div className="flex items-center gap-2">
                      <ArrowRightCircle className="w-4 h-4 text-primary-500" />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">
                        {pipe.input || "Default Source"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Output
                    </span>
                    <div className="flex items-center gap-2">
                      <Webhook className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">
                        {pipe.output || "Default Sync"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-end justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex flex-col gap-2 w-full mr-8">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Error Trend (24h)
                    </span>
                    <div className="h-8 w-full flex items-end gap-1">
                      {pipe.errorTrend?.map((val, i) => (
                        <div
                          key={i}
                          className={cn(
                            "flex-1 rounded-t-sm",
                            pipe.status === "Healthy"
                              ? "bg-emerald-500/30"
                              : pipe.status === "Critical"
                                ? "bg-red-500/30"
                                : "bg-yellow-500/30"
                          )}
                          style={{ height: `${val * 3}px` }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-9 px-4 font-bold text-xs uppercase tracking-wider"
                    >
                      History
                    </Button>
                    {pipe.status === "Critical" ? (
                      <Button
                        size="sm"
                        className="h-9 px-4 font-bold text-xs uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => handleAction("fix_pipeline")}
                      >
                        <Hammer className="w-3 h-3 mr-2" />
                        Fix Now
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-4 font-bold text-xs uppercase tracking-wider border-primary-500/20 text-primary-600 hover:bg-primary-50"
                      >
                        <Terminal className="w-3 h-3 mr-2" />
                        Config
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}

            {pipe.status === "Paused" && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <span className="text-sm text-slate-500 italic font-medium">
                  Configuration frozen at {pipe.version}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary-600 font-bold gap-2"
                  onClick={() => handleAction("resume_pipeline")}
                >
                  <Play className="w-4 h-4" />
                  Resume Pipeline
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      <Sheet open={!!selectedPipeline} onOpenChange={(open) => !open && setSelectedPipeline(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedPipeline && (
            <div className="space-y-10 py-6">
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Detail View
                    </span>
                    <SheetTitle className="text-2xl font-bold mt-1">
                      {selectedPipeline.name}
                    </SheetTitle>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge
                      variant={selectedPipeline.status === "Healthy" ? "success" : "destructive"}
                    >
                      {selectedPipeline.status}
                    </Badge>
                    <Switch
                      checked={selectedPipeline.status === "Healthy"}
                      onCheckedChange={() => handleAction("toggle_pipeline")}
                    />
                  </div>
                </div>
              </SheetHeader>

              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Latency (P99)
                  </span>
                  <div className="text-xl font-bold mt-1">{selectedPipeline.latency || "---"}</div>
                </Card>
                <Card className="p-4 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Processed</span>
                  <div className="text-xl font-bold mt-1 text-primary-600">
                    {selectedPipeline.throughput || "---"}
                  </div>
                </Card>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                  Execution Flow
                </h3>
                <div className="relative space-y-8 pl-12 before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  <div className="relative">
                    <div className="absolute -left-12 h-12 w-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 bg-white dark:bg-slate-950 z-10 transition-transform hover:scale-110">
                      <ArrowRightCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">
                        {selectedPipeline.input || "Default Source"}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">Type: API Connector</p>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-12 h-12 w-12 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 bg-white dark:bg-slate-950 z-10">
                      <Shuffle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">Normalization Engine</h4>
                      <p className="text-xs text-slate-500 font-medium">
                        Rule: standard_currency_mapping
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute -left-12 h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 bg-white dark:bg-slate-950 z-10">
                      <LogOut className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold">
                        {selectedPipeline.output || "Default Sink"}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">Storage Class: Standard</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                  Infrastructure
                </h3>
                <Card className="p-6 border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex flex-col gap-2">
                    <Button
                      className="w-full h-12 bg-primary-600 hover:bg-primary-700 text-white font-bold gap-2 shadow-lg shadow-primary-600/20"
                      onClick={() => handleAction("generate_patch")}
                    >
                      <GitCommit className="w-5 h-5" />
                      Generate Provisioning Patch
                    </Button>
                    <p className="text-[11px] text-center text-slate-400 italic font-medium px-4">
                      Converts current UI configuration into a Terraform/Kubernetes manifest and
                      opens a CI/CD pull request.
                    </p>
                  </div>
                </Card>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                  Version History
                </h3>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  <div className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">v1.4.2</span>
                        <span className="text-xs text-slate-500">Deployed by @jdoe</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-slate-400">2d ago</span>
                  </div>
                  <div className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-slate-300" />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">v1.4.1</span>
                        <span className="text-xs text-slate-500">Auto-rollback failed</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-slate-400">5d ago</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <ReasonForChangeDialog
        isOpen={isReasonDialogOpen}
        onClose={() => setIsReasonDialogOpen(false)}
        onConfirm={confirmAction}
        title={`Confirm ${pendingAction
          ?.split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ")}`}
      />
    </div>
  );
}
