"use client";

import Link from "next/link";
import { AlertTriangle, CircleAlert, Info, ListChecks } from "lucide-react";
import type { OperatorRunDetail } from "@/types/operator-run-detail";
import {
  deriveOperatorRunAttention,
  deriveOperatorRunNextActions,
  type OperatorAttentionSeverity,
} from "@/lib/runs/operator-run-truth";
import { cn } from "@/lib/utils";

const severityIcon: Record<OperatorAttentionSeverity, typeof CircleAlert> = {
  critical: CircleAlert,
  warning: AlertTriangle,
  info: Info,
};

const severityStyles: Record<OperatorAttentionSeverity, string> = {
  critical: "border-red-500/25 bg-red-500/5 text-foreground",
  warning: "border-amber-500/25 bg-amber-500/5 text-foreground",
  info: "border-border/80 bg-muted/30 text-foreground",
};

const severityLabel: Record<OperatorAttentionSeverity, string> = {
  critical: "Requires action",
  warning: "Review",
  info: "Context",
};

interface RunOperatorTruthPanelProps {
  run: OperatorRunDetail;
}

export function RunOperatorTruthPanel({ run }: RunOperatorTruthPanelProps) {
  const attention = deriveOperatorRunAttention(run);
  const nextActions = deriveOperatorRunNextActions(run);

  if (attention.length === 0 && nextActions.length === 0) {
    return null;
  }

  return (
    <section
      className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm overflow-hidden"
      aria-label="Operator run truth"
    >
      <div className="border-b border-border/50 px-5 py-4 flex flex-wrap items-center gap-3 justify-between bg-muted/20">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Run intelligence
          </p>
          <h2 className="text-lg font-semibold tracking-tight text-foreground mt-0.5">
            What needs attention on this run
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            Signals below come from the canonical run payload — exceptions, proof posture, drift,
            and recorded deltas. Nothing here is inferred client-side.
          </p>
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <CircleAlert className="w-3.5 h-3.5" />
            Attention
          </h3>
          {attention.length === 0 ? (
            <p className="text-sm text-muted-foreground border border-dashed rounded-xl p-4">
              No blocking signals from the server for this run. Still verify exceptions and proof
              posture before close.
            </p>
          ) : (
            <ul className="space-y-2">
              {attention.map((item) => {
                const Icon = severityIcon[item.severity];
                return (
                  <li
                    key={`${item.code}-${item.title}`}
                    className={cn("rounded-xl border p-4 text-sm", severityStyles[item.severity])}
                  >
                    <div className="flex items-start gap-3">
                      <Icon
                        className={cn(
                          "w-4 h-4 shrink-0 mt-0.5",
                          item.severity === "critical" && "text-red-600 dark:text-red-400",
                          item.severity === "warning" && "text-amber-600 dark:text-amber-400",
                          item.severity === "info" && "text-muted-foreground"
                        )}
                        aria-hidden
                      />
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-foreground">{item.title}</span>
                          <span className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">
                            {severityLabel[item.severity]}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {item.detail}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <ListChecks className="w-3.5 h-3.5" />
            Suggested next steps
          </h3>
          {nextActions.length === 0 ? (
            <p className="text-sm text-muted-foreground border border-dashed rounded-xl p-4">
              No automated suggestions for this state.
            </p>
          ) : (
            <ol className="space-y-3 list-none m-0 p-0">
              {nextActions.map((action, i) => (
                <li
                  key={`${action.label}-${i}`}
                  className="rounded-xl border border-border/60 bg-background/50 p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                      {i + 1}
                    </span>
                    <div className="min-w-0 space-y-1">
                      {action.href ? (
                        <Link
                          href={action.href}
                          className="text-sm font-semibold text-primary hover:underline"
                        >
                          {action.label}
                        </Link>
                      ) : (
                        <span className="text-sm font-semibold text-foreground">
                          {action.label}
                        </span>
                      )}
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {action.rationale}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}
