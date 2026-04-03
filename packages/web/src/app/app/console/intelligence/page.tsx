"use client";

/**
 * Reconciliation Intelligence Timeline
 *
 * First-class operator surface for cross-run intelligence:
 * - Panel 1: Run Quality Timeline (match rate, proof state, trend)
 * - Panel 2: Recurring Exception Families (adjudication memory, ranked by score)
 * - Panel 3: Operator Decision Memory (recent adjudication decisions)
 *
 * Data source: GET /api/console/intelligence
 * Refresh: 60-second interval (not a live operational surface)
 * All empty/degraded states are explicit — never blank.
 */

import { useEffect, useState, useCallback } from "react";
import { formatDistanceToNow, format } from "date-fns";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Brain,
  BarChart3,
  History,
  ChevronRight,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CrossRunIntelligenceSummary } from "@settler/reconciliation-core";

// ─────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────

function useIntelligence() {
  const [data, setData] = useState<CrossRunIntelligenceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/console/intelligence", { credentials: "same-origin" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      const json: CrossRunIntelligenceSummary = await res.json();
      setData(json);
      setLastRefreshed(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load intelligence data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch_();
    const interval = setInterval(fetch_, 60_000);
    return () => clearInterval(interval);
  }, [fetch_]);

  return { data, loading, error, lastRefreshed, refresh: fetch_ };
}

// ─────────────────────────────────────────────
// SHARED ATOMS
// ─────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
}) {
  return (
    <CardHeader className="pb-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
          </div>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription className="mt-0.5">{subtitle}</CardDescription>
          </div>
        </div>
        {badge && <div className="shrink-0">{badge}</div>}
      </div>
    </CardHeader>
  );
}

function EmptyPanel({ message, detail }: { message: string; detail?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 bg-muted/20 py-10 px-6 text-center">
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
      {detail && <p className="text-xs text-muted-foreground/60 max-w-xs">{detail}</p>}
    </div>
  );
}

function UnavailablePanel({ reasonCodes }: { reasonCodes: string[] }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-destructive/20 bg-destructive/5 py-10 px-6 text-center">
      <AlertTriangle className="h-4 w-4 text-destructive/60" aria-hidden="true" />
      <p className="text-sm font-medium text-destructive/80">Intelligence unavailable</p>
      {reasonCodes.length > 0 && (
        <p className="text-xs text-muted-foreground/60 font-mono">
          {reasonCodes.join(" · ")}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// PANEL 1 — RUN QUALITY TIMELINE
// ─────────────────────────────────────────────

type OverallTrend = CrossRunIntelligenceSummary["runTimeline"]["overallTrend"];

function TrendIcon({ trend }: { trend: OverallTrend }) {
  if (trend === "improving") return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />;
  if (trend === "regressing") return <TrendingDown className="h-3.5 w-3.5 text-rose-500" aria-hidden="true" />;
  if (trend === "volatile") return <Activity className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />;
  if (trend === "stable") return <Minus className="h-3.5 w-3.5 text-sky-500" aria-hidden="true" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground/40" aria-hidden="true" />;
}

function TrendBadge({ trend }: { trend: OverallTrend }) {
  const label =
    trend === "improving"
      ? "Improving"
      : trend === "regressing"
        ? "Regressing"
        : trend === "volatile"
          ? "Volatile"
          : trend === "stable"
            ? "Stable"
            : "Unavailable";

  const variant =
    trend === "improving"
      ? "success"
      : trend === "regressing"
        ? "destructive"
        : trend === "volatile"
          ? "warning"
          : trend === "stable"
            ? "info"
            : "secondary";

  return (
    <Badge variant={variant} size="sm" className="gap-1">
      <TrendIcon trend={trend} />
      {label}
    </Badge>
  );
}

/** A single colored bar representing one run's match rate */
function RunBar({
  entry,
}: {
  entry: CrossRunIntelligenceSummary["runTimeline"]["runs"][number];
}) {
  const rate = entry.matchRate ?? 0;
  const pct = Math.round(rate * 100);
  const isFailed = entry.status === "failed";

  const barColor = isFailed
    ? "bg-rose-500/70"
    : pct >= 95
      ? "bg-emerald-500"
      : pct >= 80
        ? "bg-sky-500"
        : pct >= 60
          ? "bg-amber-500"
          : "bg-rose-500";

  const label = isFailed ? "Failed" : `${pct}%`;
  const title = [
    entry.jobName,
    entry.startedAt ? format(new Date(entry.startedAt), "MMM d, HH:mm") : null,
    isFailed ? "failed" : `${pct}% match rate`,
    `${entry.matchedCount.toLocaleString()} matched`,
    entry.unmatchedTotal > 0 ? `${entry.unmatchedTotal.toLocaleString()} unmatched` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="group flex flex-col items-center gap-1.5" title={title}>
      {/* Bar */}
      <div className="relative flex h-20 w-5 flex-col-reverse overflow-hidden rounded-sm bg-muted/30">
        <div
          className={cn("rounded-sm transition-all duration-300", barColor)}
          style={{ height: isFailed ? "100%" : `${Math.max(pct, 4)}%` }}
          aria-label={label}
        />
      </div>
      {/* Label */}
      <span
        className={cn(
          "text-[9px] font-medium tabular-nums leading-none",
          isFailed ? "text-rose-500/80" : pct >= 95 ? "text-emerald-600/80" : "text-muted-foreground/60"
        )}
      >
        {label}
      </span>
    </div>
  );
}

function RunQualityTimeline({
  timeline,
}: {
  timeline: CrossRunIntelligenceSummary["runTimeline"];
}) {
  if (timeline.state === "unavailable") {
    return <UnavailablePanel reasonCodes={timeline.reasonCodes} />;
  }

  if (timeline.state === "insufficient_history" || timeline.runs.length === 0) {
    return (
      <EmptyPanel
        message="Building run history"
        detail="Complete at least 3 reconciliation runs to unlock the quality timeline and trend analysis."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold mb-1">
            Runs shown
          </p>
          <p className="text-lg font-semibold tabular-nums">{timeline.runs.length}</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold mb-1">
            Completed
          </p>
          <p className="text-lg font-semibold tabular-nums">{timeline.totalCompletedRuns}</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold mb-1">
            Trend
          </p>
          <div className="mt-0.5">
            <TrendBadge trend={timeline.overallTrend} />
          </div>
        </div>
      </div>

      {/* Timeline bars — newest to oldest, left to right */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-bold mb-3">
          Match Rate · Most Recent →
        </p>
        <div
          className="flex items-end gap-1.5 overflow-x-auto pb-1"
          role="img"
          aria-label={`Run quality timeline showing ${timeline.runs.length} runs`}
        >
          {timeline.runs.map((entry) => (
            <RunBar key={entry.runId} entry={entry} />
          ))}
        </div>
        {/* Scale legend */}
        <div className="mt-2 flex items-center gap-3 flex-wrap">
          {[
            { color: "bg-emerald-500", label: "≥95%" },
            { color: "bg-sky-500", label: "80–95%" },
            { color: "bg-amber-500", label: "60–80%" },
            { color: "bg-rose-500", label: "<60%" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1">
              <div className={cn("h-2 w-2 rounded-sm shrink-0", color)} aria-hidden="true" />
              <span className="text-[10px] text-muted-foreground/60">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Most recent run detail */}
      {timeline.runs[0] && (
        <div className="rounded-lg border border-border/40 bg-card p-3 text-xs space-y-1.5">
          <p className="font-medium text-foreground/80">
            Latest: {timeline.runs[0].jobName}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
            <span>
              {timeline.runs[0].matchedCount.toLocaleString()} matched
            </span>
            <span>
              {timeline.runs[0].unmatchedTotal.toLocaleString()} unmatched
            </span>
            {timeline.runs[0].conflictCount > 0 && (
              <span className="text-amber-600">
                {timeline.runs[0].conflictCount.toLocaleString()} conflicts
              </span>
            )}
            {timeline.runs[0].startedAt && (
              <span>
                {formatDistanceToNow(new Date(timeline.runs[0].startedAt), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// PANEL 2 — RECURRING EXCEPTION FAMILIES
// ─────────────────────────────────────────────

type FamilyTrend = CrossRunIntelligenceSummary["recurringFamilies"]["families"][number]["trend"];
type FamilyCertainty = CrossRunIntelligenceSummary["recurringFamilies"]["families"][number]["certainty"];

function FamilyTrendPill({ trend }: { trend: FamilyTrend }) {
  if (trend === "strengthening") {
    return (
      <Badge variant="destructive" size="sm" className="gap-1">
        <TrendingUp className="h-2.5 w-2.5" aria-hidden="true" />
        Strengthening
      </Badge>
    );
  }
  if (trend === "weakening") {
    return (
      <Badge variant="success" size="sm" className="gap-1">
        <TrendingDown className="h-2.5 w-2.5" aria-hidden="true" />
        Resolving
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" size="sm" className="gap-1">
      <Minus className="h-2.5 w-2.5" aria-hidden="true" />
      Stable
    </Badge>
  );
}

function CertaintyDot({ certainty }: { certainty: FamilyCertainty }) {
  return (
    <span
      title={`Certainty: ${certainty}`}
      aria-label={`Certainty ${certainty}`}
      className={cn(
        "inline-block h-2 w-2 rounded-full shrink-0",
        certainty === "high"
          ? "bg-emerald-500"
          : certainty === "medium"
            ? "bg-amber-400"
            : "bg-muted-foreground/30"
      )}
    />
  );
}

function RecurringFamilyRow({
  family,
  rank,
}: {
  family: CrossRunIntelligenceSummary["recurringFamilies"]["families"][number];
  rank: number;
}) {
  const displayName = family.archetypeLabel ?? family.archetypeCode ?? family.resolutionKey;
  const unresolvedPct =
    family.totalOccurrences > 0
      ? Math.round((family.unresolvedCount / family.totalOccurrences) * 100)
      : 0;

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/30 last:border-0">
      {/* Rank */}
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted/40 text-[10px] font-bold text-muted-foreground/60">
        {rank}
      </span>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium truncate">{displayName}</span>
          {family.archetypeCategory && (
            <Badge variant="outline" size="sm">
              {family.archetypeCategory}
            </Badge>
          )}
          <FamilyTrendPill trend={family.trend} />
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
          <span className="tabular-nums">
            <span className="font-medium text-foreground">{family.totalOccurrences}</span>{" "}
            occurrences
          </span>
          {family.unresolvedCount > 0 && (
            <span className="text-amber-600 font-medium tabular-nums">
              {family.unresolvedCount} unresolved ({unresolvedPct}%)
            </span>
          )}
          {family.resolvedCount > 0 && (
            <span className="text-emerald-600 tabular-nums">
              {family.resolvedCount} resolved
            </span>
          )}
          {family.avgDurationMs !== null && (
            <span>
              avg {(family.avgDurationMs / 1000).toFixed(1)}s to resolve
            </span>
          )}
        </div>

        {/* Resolution pattern + certainty */}
        <div className="flex items-center gap-2 flex-wrap">
          <CertaintyDot certainty={family.certainty} />
          <span className="text-[10px] text-muted-foreground/60 capitalize">
            {family.certainty} confidence
          </span>
          {family.topOutcome && (
            <>
              <span className="text-muted-foreground/30">·</span>
              <span className="text-[10px] text-muted-foreground/60">
                Top outcome: <span className="font-medium">{family.topOutcome}</span>
              </span>
            </>
          )}
          {family.lastSeenAt && (
            <>
              <span className="text-muted-foreground/30">·</span>
              <span className="text-[10px] text-muted-foreground/60">
                Last seen {formatDistanceToNow(new Date(family.lastSeenAt), { addSuffix: true })}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function RecurringFamiliesPanel({
  recurringFamilies,
}: {
  recurringFamilies: CrossRunIntelligenceSummary["recurringFamilies"];
}) {
  if (recurringFamilies.state === "unavailable") {
    return <UnavailablePanel reasonCodes={recurringFamilies.reasonCodes} />;
  }

  if (recurringFamilies.state === "building" || recurringFamilies.families.length === 0) {
    return (
      <EmptyPanel
        message="Building exception intelligence"
        detail="Adjudicate exceptions to build pattern memory. Settler will start identifying recurring families as your adjudication history grows."
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Zap className="h-3.5 w-3.5 text-primary/60 shrink-0" aria-hidden="true" />
        <span>
          <span className="font-semibold text-foreground">
            {recurringFamilies.totalAdjudications.toLocaleString()}
          </span>{" "}
          adjudications analysed ·{" "}
          <span className="font-semibold text-foreground">
            {recurringFamilies.families.length}
          </span>{" "}
          recurring{" "}
          {recurringFamilies.families.length === 1 ? "family" : "families"} identified
        </span>
      </div>

      {/* Family list */}
      <div>
        {recurringFamilies.families.map((family, i) => (
          <RecurringFamilyRow
            key={family.archetypeId ?? family.resolutionKey}
            family={family}
            rank={i + 1}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PANEL 3 — OPERATOR DECISION MEMORY
// ─────────────────────────────────────────────

function ResolutionChip({ resolution }: { resolution: string }) {
  const variant =
    resolution === "matched" || resolution === "manual"
      ? "success"
      : resolution === "ignored"
        ? "secondary"
        : resolution === "escalated"
          ? "warning"
          : "outline";

  return (
    <Badge variant={variant} size="sm">
      {resolution}
    </Badge>
  );
}

function DecisionRow({
  decision,
}: {
  decision: CrossRunIntelligenceSummary["decisionMemory"]["recentDecisions"][number];
}) {
  const displayFamily = decision.archetypeLabel ?? decision.archetypeCode ?? "Unclassified";
  const isResolved = decision.outcome === "resolved" || decision.resolution === "matched" || decision.resolution === "manual";

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/30 last:border-0">
      {/* Outcome icon */}
      <div className="mt-0.5 shrink-0">
        {isResolved ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
        ) : (
          <Clock className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium truncate">{displayFamily}</span>
          <ResolutionChip resolution={decision.resolution} />
        </div>
        <div className="flex items-center gap-2 flex-wrap text-[10px] text-muted-foreground/60">
          {decision.resolutionReason && (
            <span className="font-mono">{decision.resolutionReason}</span>
          )}
          {decision.durationMs !== null && (
            <span>{(decision.durationMs / 1000).toFixed(1)}s</span>
          )}
          <span>{formatDistanceToNow(new Date(decision.createdAt), { addSuffix: true })}</span>
          {decision.adjudicationType !== "initial" && (
            <Badge variant="outline" size="sm">
              {decision.adjudicationType}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

function DecisionMemoryPanel({
  decisionMemory,
}: {
  decisionMemory: CrossRunIntelligenceSummary["decisionMemory"];
}) {
  if (decisionMemory.state === "unavailable") {
    return <UnavailablePanel reasonCodes={decisionMemory.reasonCodes} />;
  }

  if (decisionMemory.state === "empty" || decisionMemory.recentDecisions.length === 0) {
    return (
      <EmptyPanel
        message="No decisions recorded yet"
        detail="Every operator adjudication is recorded here as institutional memory. Start adjudicating exceptions to build your decision trail."
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <History className="h-3.5 w-3.5 text-primary/60 shrink-0" aria-hidden="true" />
        <span>
          <span className="font-semibold text-foreground">
            {decisionMemory.totalDecisions.toLocaleString()}
          </span>{" "}
          total decisions recorded · showing {decisionMemory.recentDecisions.length} most recent
        </span>
      </div>

      {/* Decision list */}
      <div>
        {decisionMemory.recentDecisions.map((decision) => (
          <DecisionRow key={decision.memoryId} decision={decision} />
        ))}
      </div>

      {decisionMemory.totalDecisions > decisionMemory.recentDecisions.length && (
        <a
          href="/app/console/exceptions"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          View all exceptions
          <ChevronRight className="h-3 w-3" aria-hidden="true" />
        </a>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────

export default function IntelligenceTimelinePage() {
  const { data, loading, error, lastRefreshed, refresh } = useIntelligence();

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Reconciliation Intelligence</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cross-run pattern analysis, exception family memory, and operator decision history.
            Settler learns from your reconciliation history over time.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {lastRefreshed && (
            <span className="text-xs text-muted-foreground/60 hidden sm:block">
              Updated {formatDistanceToNow(lastRefreshed, { addSuffix: true })}
            </span>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            className={cn(
              "flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium",
              "hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              loading && "opacity-50 cursor-not-allowed"
            )}
            aria-label="Refresh intelligence data"
          >
            <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} aria-hidden="true" />
            Refresh
          </button>
        </div>
      </div>

      {/* Top-level state banners */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {loading && !data && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-64 flex items-center justify-center">
                <div className="h-4 w-32 rounded bg-muted/40" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {data && (
        <>
          {/* State banner when fully building */}
          {data.state === "building" && (
            <div className="flex items-center gap-2.5 rounded-lg border border-sky-500/20 bg-sky-500/5 px-4 py-3 text-sm text-sky-700 dark:text-sky-400">
              <Brain className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                Settler is building your intelligence profile. Run more reconciliations and
                adjudicate exceptions to unlock full pattern analysis.
              </span>
            </div>
          )}

          {/* Three-panel grid */}
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {/* Panel 1 — Run Quality Timeline */}
            <Card className="xl:col-span-2">
              <SectionHeader
                icon={BarChart3}
                title="Run Quality Timeline"
                subtitle="Match rate and trend across recent reconciliation runs"
                badge={
                  data.runTimeline.state === "available" ? (
                    <TrendBadge trend={data.runTimeline.overallTrend} />
                  ) : undefined
                }
              />
              <CardContent>
                <RunQualityTimeline timeline={data.runTimeline} />
              </CardContent>
            </Card>

            {/* Panel 3 — Decision Memory (smaller, fits in 1 column) */}
            <Card>
              <SectionHeader
                icon={History}
                title="Decision Memory"
                subtitle="Recent operator adjudication decisions"
                badge={
                  data.decisionMemory.state === "available" ? (
                    <Badge variant="secondary" size="sm">
                      {data.decisionMemory.totalDecisions.toLocaleString()} total
                    </Badge>
                  ) : undefined
                }
              />
              <CardContent>
                <DecisionMemoryPanel decisionMemory={data.decisionMemory} />
              </CardContent>
            </Card>

            {/* Panel 2 — Recurring Exception Families (full width) */}
            <Card className="md:col-span-2 xl:col-span-3">
              <SectionHeader
                icon={Brain}
                title="Recurring Exception Families"
                subtitle="Exception patterns ranked by recurrence score — accumulated across all runs"
                badge={
                  data.recurringFamilies.state === "available" ? (
                    <Badge variant="outline" size="sm">
                      {data.recurringFamilies.families.length} identified
                    </Badge>
                  ) : undefined
                }
              />
              <CardContent>
                <RecurringFamiliesPanel recurringFamilies={data.recurringFamilies} />
              </CardContent>
            </Card>
          </div>

          {/* Footer */}
          <p className="text-xs text-muted-foreground/40 text-right">
            Generated at{" "}
            {data.generatedAt
              ? format(new Date(data.generatedAt), "MMM d, yyyy HH:mm:ss")
              : "—"}
          </p>
        </>
      )}
    </div>
  );
}
