"use client";

import { useState } from "react";
import { Filter, AlertTriangle, Fingerprint, AlertCircle, Info, Edit, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReasonForChangeDialog } from "@/components/shared/ReasonForChangeDialog";
import { cn } from "@/lib/utils";

const queueItems = [
  {
    id: "REC-9021",
    amount: "$4,500.00",
    severity: "HIGH SEVERITY",
    discrepancy: "Discrepancy",
    confidence: "Low Match",
    traceId: "8a9f-2b3c...",
  },
  {
    id: "REC-9022",
    amount: "$120.50",
    severity: "MEDIUM",
    discrepancy: "Discrepancy",
    confidence: "Medium Match",
    traceId: "7c2d-9a4f...",
  },
  {
    id: "REC-9023",
    amount: "$0.05",
    severity: "LOW",
    discrepancy: "Discrepancy",
    confidence: "High Match",
    traceId: "b41e-0f2d...",
  },
];

export function ReviewQueuePanel() {
  const [activeItem, setActiveItem] = useState(queueItems[0]);
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
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground dark:text-white">
              Review Queue
            </h1>
            <p className="text-muted-foreground dark:text-muted-foreground mt-1">
              12 Pending reconciliations require human review.
            </p>
          </div>
          <Button variant="outline" size="icon" className="rounded-full">
            <Filter className="w-5 h-5 text-muted-foreground" />
          </Button>
        </div>
      </header>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Priority Queue
          </h2>
          <Button variant="link" size="sm" className="h-auto p-0 font-bold text-primary-600">
            View All
          </Button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory">
          {queueItems.map((item) => (
            <Card
              key={item.id}
              className={cn(
                "snap-center shrink-0 w-[85%] sm:w-[350px] p-5 relative overflow-hidden transition-all duration-300 cursor-pointer shadow-lg",
                activeItem?.id === item.id
                  ? "ring-2 ring-primary-500 shadow-primary-500/10"
                  : "opacity-60 scale-95"
              )}
              onClick={() => setActiveItem(item)}
            >
              {activeItem?.id === item.id && (
                <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-600" />
              )}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      item.severity === "HIGH SEVERITY"
                        ? "bg-red-500 animate-pulse"
                        : "bg-amber-500"
                    )}
                  />
                  <span className="text-xs font-mono font-bold text-muted-foreground">{item.id}</span>
                </div>
                <Badge
                  variant={
                    item.severity === "HIGH SEVERITY"
                      ? "destructive"
                      : item.severity === "MEDIUM"
                        ? "warning"
                        : "secondary"
                  }
                  className="font-bold text-[10px]"
                >
                  {item.severity}
                </Badge>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">
                    Discrepancy
                  </p>
                  <p className="text-2xl font-black text-foreground dark:text-white font-mono">
                    {item.amount}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Confidence</p>
                  <div
                    className={cn(
                      "flex items-center gap-1 text-xs font-bold",
                      item.confidence === "Low Match" ? "text-amber-600" : "text-emerald-600"
                    )}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {item.confidence}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground dark:text-white">Evidence Viewer</h2>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 dark:bg-background rounded-lg text-xs font-bold text-muted-foreground border border-border dark:border-border cursor-copy group">
            <Fingerprint className="w-4 h-4 text-primary-500" />
            <span className="font-mono">{activeItem?.traceId}</span>
          </div>
        </div>

        <Card className="overflow-hidden border-border dark:border-border shadow-sm font-medium">
          <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-800 bg-muted/20 dark:bg-background border-b border-slate-100 dark:border-border">
            <div className="p-4 text-center">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Source A (ERP)
              </p>
            </div>
            <div className="p-4 text-center">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Source B (Bank)
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            <div className="grid grid-cols-2 divide-x divide-slate-50 dark:divide-slate-800 hover:bg-muted/20/50 transition-colors">
              <div className="p-4">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                  Transaction ID
                </p>
                <p className="text-sm font-mono text-foreground dark:text-muted-foreground">TX_99283811</p>
              </div>
              <div className="p-4">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                  Transaction ID
                </p>
                <p className="text-sm font-mono text-foreground dark:text-muted-foreground">TX_99283811</p>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-slate-50 dark:divide-slate-800 bg-red-50/10 relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600" />
              <div className="p-4">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                  Amount
                </p>
                <p className="text-lg font-mono font-black text-foreground dark:text-muted-foreground">
                  500.00
                </p>
              </div>
              <div className="p-4 bg-red-50/20">
                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">
                  Amount (Mismatch)
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-mono font-black text-red-600">5,000.00</p>
                  <AlertCircle className="w-4 h-4 text-red-600" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-slate-50 dark:divide-slate-800 hover:bg-muted/20/50 transition-colors">
              <div className="p-4">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                  Currency
                </p>
                <p className="text-sm font-mono text-foreground dark:text-muted-foreground">USD</p>
              </div>
              <div className="p-4">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                  Currency
                </p>
                <p className="text-sm font-mono text-foreground dark:text-muted-foreground">USD</p>
              </div>
            </div>
          </div>
        </Card>

        <div className="p-5 bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/20 rounded-2xl flex gap-4 items-start shadow-sm ring-1 ring-primary-500/10">
          <Info className="w-6 h-6 text-primary-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-black text-primary-700 uppercase tracking-widest mb-1">
              AI Decision Co-pilot
            </h3>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground leading-relaxed font-semibold">
              The discrepancy appears to be a decimal placement error (10x difference).
              Historically, manual overrides favor Source B for this vendor. Suggested action:{" "}
              <span className="text-primary-600 underline cursor-pointer">
                Reconcile to Source B
              </span>
              .
            </p>
          </div>
        </div>
      </div>

      <div className="pt-10 flex gap-4 max-w-lg mx-auto">
        <Button
          variant="outline"
          className="flex-1 h-14 rounded-2xl gap-3 flex flex-col items-center justify-center p-0"
          onClick={() => handleAction("exception")}
        >
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <span className="text-[10px] font-black uppercase tracking-widest">Exception</span>
        </Button>
        <Button
          variant="outline"
          className="flex-1 h-14 rounded-2xl gap-3 flex flex-col items-center justify-center p-0"
          onClick={() => handleAction("override")}
        >
          <Edit className="w-5 h-5 text-muted-foreground" />
          <span className="text-[10px] font-black uppercase tracking-widest">Override</span>
        </Button>
        <Button
          className="flex-[1.5] h-14 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold gap-3 shadow-xl shadow-primary-600/30"
          onClick={() => handleAction("match")}
        >
          <Check className="w-6 h-6" />
          <span className="text-base">Match</span>
        </Button>
      </div>

      <ReasonForChangeDialog
        isOpen={isReasonDialogOpen}
        onClose={() => setIsReasonDialogOpen(false)}
        onConfirm={confirmAction}
        title={`Review Action: ${pendingAction?.charAt(0).toUpperCase()}${pendingAction?.slice(1)}`}
        description="Every manual review decision is audited. Please explain the rationale for this resolution."
      />
    </div>
  );
}
