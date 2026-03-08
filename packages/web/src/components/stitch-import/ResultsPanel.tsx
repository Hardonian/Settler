"use client";

import { useState } from "react";
import {
  Share,
  Download,
  Search,
  ChevronDown,
  Calendar,
  GitBranch,
  Filter,
  CheckCircle2,
  TrendingUp,
  XCircle,
  AlertTriangle,
  TrendingDown,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ReasonForChangeDialog } from "@/components/shared/ReasonForChangeDialog";

const results = [
  {
    id: "8a9f...2b1",
    ref: "#STR-29384",
    pipeline: "Payments_v2",
    status: "Mismatched",
    time: "10:42 AM",
    traceId: "8a9f...2b1",
  },
  {
    id: "7c2d...9a4",
    ref: "#INT-99210",
    pipeline: "Ledger_Main",
    status: "Needs Review",
    time: "10:38 AM",
    traceId: "7c2d...9a4",
  },
  {
    id: "b41e...0f2",
    ref: "#STR-29383",
    pipeline: "Payments_v2",
    status: "Matched",
    time: "10:35 AM",
    traceId: "b41e...0f2",
  },
  {
    id: "a12d...8c3",
    ref: "#STR-29382",
    pipeline: "Payments_v2",
    status: "Matched",
    time: "10:31 AM",
    traceId: "a12d...8c3",
  },
];

export function ResultsPanel() {
  const [selectedResult, setSelectedResult] = useState<(typeof results)[0] | null>(null);
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
              Reconciliation Results
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Review the outcomes of your reconciliation pipelines.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="rounded-full">
              <Share className="w-5 h-5 text-slate-500" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-primary/10 border-primary/20 text-primary-600"
            >
              <Download className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <Input
            className="pl-10 h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl"
            placeholder="Search by Trace ID, reference, or pipeline..."
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
          <Button
            variant="primary"
            className="rounded-full px-4 h-10 shadow-lg shadow-primary-600/20 gap-2"
          >
            All Status <ChevronDown className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            className="rounded-full px-4 h-10 gap-2 border-slate-200 text-slate-600"
          >
            <Calendar className="w-4 h-4" /> Last 24h
          </Button>
          <Button
            variant="outline"
            className="rounded-full px-4 h-10 gap-2 border-slate-200 text-slate-600"
          >
            <GitBranch className="w-4 h-4" /> Payments_v2
          </Button>
          <Button
            variant="outline"
            className="rounded-full px-4 h-10 gap-2 border-slate-200 text-slate-600"
          >
            <Filter className="w-4 h-4" /> More
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-emerald-500/20 bg-emerald-50/10 relative overflow-hidden group">
          <CheckCircle2 className="absolute -right-2 -top-2 w-16 h-16 text-emerald-500 opacity-5" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Matched
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">982</div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-2">
            <TrendingUp className="w-3 h-3" /> 12%
          </div>
        </Card>
        <Card className="p-4 border-rose-500/20 bg-rose-50/10 relative overflow-hidden group">
          <XCircle className="absolute -right-2 -top-2 w-16 h-16 text-rose-500 opacity-5" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Mismatch
          </span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">14</div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-rose-600 mt-2">
            <TrendingUp className="w-3 h-3" /> 2%
          </div>
        </Card>
        <Card className="p-4 border-amber-500/20 bg-amber-50/10 relative overflow-hidden group">
          <AlertTriangle className="absolute -right-2 -top-2 w-16 h-16 text-amber-500 opacity-5" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Review</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">244</div>
          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 mt-2">
            <TrendingDown className="w-3 h-3" /> 5%
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
          Recent Transactions
        </h2>
        <div className="grid grid-cols-1 gap-4">
          {results.map((res) => (
            <Card
              key={res.id}
              className={cn(
                "p-5 hover:border-primary-500/50 transition-all cursor-pointer active:scale-[0.99] border-l-4",
                res.status === "Mismatched"
                  ? "border-l-rose-500"
                  : res.status === "Needs Review"
                    ? "border-l-amber-500"
                    : "border-l-emerald-500"
              )}
              onClick={() => setSelectedResult(res)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  {res.status === "Mismatched" ? (
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                  ) : res.status === "Needs Review" ? (
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  )}
                  <Badge
                    variant={
                      res.status === "Matched"
                        ? "success"
                        : res.status === "Mismatched"
                          ? "destructive"
                          : "warning"
                    }
                  >
                    {res.status}
                  </Badge>
                </div>
                <span className="text-xs font-semibold text-slate-400">{res.time}</span>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-sm font-mono text-slate-500 mb-1">
                    Trace:{" "}
                    <span className="text-slate-900 dark:text-white font-bold">{res.traceId}</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    Tx Ref: {res.ref}
                  </div>
                  <div className="text-xs font-semibold text-slate-500 mt-1">
                    Pipeline: {res.pipeline}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary-600 font-bold gap-1 group"
                >
                  Details{" "}
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Sheet open={!!selectedResult} onOpenChange={(open) => !open && setSelectedResult(null)}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          {selectedResult && (
            <div className="space-y-8 py-6">
              <SheetHeader>
                <div>
                  <SheetTitle className="text-2xl font-bold">Evidence Viewer</SheetTitle>
                  <div className="flex items-center gap-2 mt-2">
                    {selectedResult.status === "Mismatched" ? (
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    )}
                    <span
                      className={cn(
                        "text-sm font-bold",
                        selectedResult.status === "Mismatched" ? "text-rose-500" : "text-amber-500"
                      )}
                    >
                      {selectedResult.status} • Trace {selectedResult.traceId}
                    </span>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                    Comparison Matrix
                  </h3>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 font-bold text-primary-600"
                  >
                    View Raw JSON
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <div className="w-2 h-2 rounded-full bg-blue-500" /> Source: Stripe API
                    </div>
                    <Card className="p-4 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Amount
                        </span>
                        <div className="font-mono text-sm font-bold mt-1">100.00 USD</div>
                      </div>
                      <div className="h-px bg-slate-200 dark:bg-slate-800" />
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Status
                        </span>
                        <div className="font-mono text-sm font-bold mt-1">succeeded</div>
                      </div>
                    </Card>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <div className="w-2 h-2 rounded-full bg-purple-500" /> Source: Internal DB
                    </div>
                    <Card className="p-4 bg-rose-50/30 dark:bg-rose-950/20 border-rose-500/30 space-y-4 relative">
                      <div className="absolute inset-x-0 top-0 h-1 bg-rose-500/10" />
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Amount
                        </span>
                        <div className="font-mono text-sm font-black text-rose-600 mt-1">
                          99.00 USD
                        </div>
                      </div>
                      <div className="h-px bg-rose-500/10 my-2" />
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Status
                        </span>
                        <div className="font-mono text-sm font-bold mt-1">completed</div>
                      </div>
                    </Card>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                    Logic Trace
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 p-4 rounded-xl border border-emerald-500/20 bg-emerald-50/5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <div>
                        <p className="text-sm font-bold">Currency Match</p>
                        <p className="text-xs text-slate-500 font-medium">
                          Both sources match ISO-4217 code: USD
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-xl border border-rose-500/20 bg-rose-50/5">
                      <XCircle className="w-5 h-5 text-rose-500" />
                      <div>
                        <p className="text-sm font-bold text-rose-600">Exact Amount Match</p>
                        <p className="text-xs text-rose-500 font-medium font-mono">
                          Mismatch detected: -1.00 USD (-1%)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 font-bold"
                    onClick={() => handleAction("ignore_mismatch")}
                  >
                    Ignore Mismatch
                  </Button>
                  <Button
                    className="flex-1 h-12 bg-primary-600 hover:bg-primary-700 text-white font-bold shadow-lg shadow-primary-600/20"
                    onClick={() => handleAction("open_review")}
                  >
                    Open in Review Queue
                  </Button>
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
        title={`Confirm Action`}
        description="Provide a reason for resolving or ignoring this variance."
      />
    </div>
  );
}
