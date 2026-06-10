/**
 * Reconciliation View Component
 *
 * Displays reconciliation summary and items ranked by impact.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle2, RefreshCw, Play } from "lucide-react";
import { useGovernanceState } from "@/hooks/use-governance-state";
import { FreezeBlockedButton } from "@/components/shared/FreezeBlockedButton";
import { FreezeErrorAlert } from "@/components/shared/FreezeErrorAlert";
import { getGovernanceRecoveryHref } from "@/lib/governance/freeze-client";
import type { ReconciliationSummary, ReconciliationItem } from "@/lib/domain/types";

interface ReconciliationViewProps {
  reconciliationId?: string;
  onRunReconciliation?: () => void;
}

export function ReconciliationView({
  reconciliationId,
  onRunReconciliation,
}: ReconciliationViewProps) {
  const [summary, setSummary] = useState<ReconciliationSummary | null>(null);
  const [items, setItems] = useState<ReconciliationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isFrozen, governanceState } = useGovernanceState();

  useEffect(() => {
    if (reconciliationId) {
      fetchReconciliation();
    } else {
      setLoading(false);
    }
  }, [reconciliationId]);

  const fetchReconciliation = async () => {
    if (!reconciliationId) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/console/reconciliation?id=${reconciliationId}`);

      if (!res.ok) {
        throw new Error(`Failed to fetch reconciliation: ${res.status}`);
      }

      const data = await res.json();
      setSummary(data.reconciliation);
      setItems(data.items || []);
    } catch (error: unknown) {
      console.error("Failed to fetch reconciliation:", error);
      setError(error instanceof Error ? error.message : "Failed to load reconciliation");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  };

  const getStatusColor = (status: ReconciliationItem["status"]) => {
    switch (status) {
      case "matched":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "unmatched":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "conflict":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      case "reviewed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
    }
  };

  const getUrgencyColor = (urgency: ReconciliationItem["urgency"]) => {
    switch (urgency) {
      case "critical":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "low":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading reconciliation...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Button onClick={fetchReconciliation}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    const canRunFromSurface = typeof onRunReconciliation === "function";

    return (
      <Card>
        <CardContent className="py-12 text-center">
          <RefreshCw className="w-12 h-12 mx-auto mb-4 text-muted-foreground/60" />
          <h3 className="text-lg font-semibold mb-2">
            {reconciliationId ? "Results not available yet" : "Select a completed run"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {reconciliationId
              ? "This run has not produced a visible result set yet, or the result is outside your current tenant scope."
              : "This surface explains completed reconciliation outcomes. Start a run from your connected job or API workflow, then open that run here."}
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href="/console/runs">Open Runs</Link>
            </Button>
            {canRunFromSurface ? (
              <FreezeBlockedButton
                onClick={onRunReconciliation}
                isFrozen={isFrozen}
                freezeReason={governanceState?.freeze_reason}
                frozenMessage="Reconciliation run blocked by tenant freeze"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Reconciliation
              </FreezeBlockedButton>
            ) : (
              <Button asChild variant="outline">
                <Link href="/console/docs">Review Run Setup</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {isFrozen ? (
        <FreezeErrorAlert
          reason={governanceState?.freeze_reason}
          frozenAt={governanceState?.frozen_at || undefined}
          recoveryAction={{
            label: "Open Governance Controls",
            href: getGovernanceRecoveryHref(),
          }}
        />
      ) : null}
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Reconciliation Summary</CardTitle>
              <CardDescription>
                Status:{" "}
                <Badge
                  className={summary.status === "completed" ? "bg-green-100 text-green-800" : ""}
                >
                  {summary.status}
                </Badge>
              </CardDescription>
            </div>
            <Button onClick={fetchReconciliation} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {summary.status !== "completed" && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
              This run is still in progress. Counts and impact ranking remain provisional until the
              run reaches a terminal state.
            </div>
          )}
          {summary.executionConfig && (
            <div className="mb-4 rounded-lg border border-border bg-muted/20 p-4 text-sm">
              <p className="font-medium text-foreground mb-2">Configuration used for this run</p>
              <p className="text-muted-foreground mb-3">
                Tolerances and fuzzy settings below are frozen on the run record. Changing workspace
                rules does not rewrite history for past runs.
              </p>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground">
                <div>
                  <dt className="text-xs uppercase tracking-wide">Amount tolerance</dt>
                  <dd className="font-mono text-foreground">
                    {summary.executionConfig.amountTolerance}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide">Date window (days)</dt>
                  <dd className="font-mono text-foreground">
                    {summary.executionConfig.dateWindowDays}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide">Description similarity min</dt>
                  <dd className="font-mono text-foreground">
                    {summary.executionConfig.fuzzyDescriptionThreshold}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide">Require exact amount</dt>
                  <dd className="font-mono text-foreground">
                    {summary.executionConfig.requireExactAmount ? "Yes" : "No"}
                  </dd>
                </div>
              </dl>
              {(summary.configVersion || summary.configSource) && (
                <p className="mt-3 text-xs text-muted-foreground">
                  {summary.configSource && (
                    <span>
                      Rule source: <span className="font-mono">{summary.configSource}</span>
                    </span>
                  )}
                  {summary.configSource && summary.configVersion && " · "}
                  {summary.configVersion && (
                    <span>
                      Version: <span className="font-mono">{summary.configVersion}</span>
                    </span>
                  )}
                  {typeof summary.matchingRulesCount === "number" && (
                    <span>
                      {" "}
                      · Rules loaded:{" "}
                      <span className="font-mono">{summary.matchingRulesCount}</span>
                    </span>
                  )}
                </p>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/10 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Total Delta</p>
              <p className="text-2xl font-bold">
                {formatCurrency(summary.totalDelta, summary.currency)}
              </p>
            </div>
            <div className="p-4 bg-muted/10 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Unmatched</p>
              <p className="text-2xl font-bold">{summary.mismatchCount}</p>
            </div>
            <div className="p-4 bg-muted/10 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Started</p>
              <p className="text-sm font-medium">{new Date(summary.startedAt).toLocaleString()}</p>
            </div>
            <div className="p-4 bg-muted/10 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Completed</p>
              <p className="text-sm font-medium">
                {summary.completedAt
                  ? new Date(summary.completedAt).toLocaleString()
                  : "In progress"}
              </p>
            </div>
          </div>

          {/* Highest Risk Item */}
          {summary.highestRiskItem && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900 dark:text-red-300 mb-1">
                    Highest Risk Item
                  </p>
                  <p className="text-sm text-red-800 dark:text-red-400">
                    Delta:{" "}
                    {formatCurrency(
                      summary.highestRiskItem.delta,
                      summary.highestRiskItem.sourceCurrency
                    )}{" "}
                    | Risk: {Math.round(summary.highestRiskItem.impact.riskScore * 100)}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reconciliation Items</CardTitle>
          <CardDescription>
            Ranked by impact (risk score). {items.length} item{items.length !== 1 ? "s" : ""} total.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No row-level result items to display"
              description="This run has a summary record, but no detailed result rows are currently visible for the selected tenant and filters."
              hint="Use the run detail to confirm execution posture, then inspect exceptions or rerun if you expected row-level evidence."
              action={{ label: "Open Runs", href: "/console/runs" }}
              secondaryAction={
                reconciliationId
                  ? {
                      label: "Open Exceptions",
                      href: `/console/exceptions?runId=${reconciliationId}`,
                      variant: "outline",
                    }
                  : undefined
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Source Amount</TableHead>
                  <TableHead>Target Amount</TableHead>
                  <TableHead>Delta</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Confidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(item.sourceAmount, item.sourceCurrency)}</TableCell>
                    <TableCell>{formatCurrency(item.targetAmount, item.targetCurrency)}</TableCell>
                    <TableCell className={item.delta >= 0 ? "text-green-600" : "text-red-600"}>
                      {formatCurrency(item.delta, item.sourceCurrency)}
                    </TableCell>
                    <TableCell className="max-w-sm">
                      <div className="space-y-1">
                        <p className="text-sm text-foreground">{item.explanation.summary}</p>
                        {item.explanation.suggestedNextStep && (
                          <p className="text-xs text-muted-foreground">
                            Next: {item.explanation.suggestedNextStep}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={item.impact.riskScore * 100} className="w-20" />
                        <span className="text-sm">{Math.round(item.impact.riskScore * 100)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getUrgencyColor(item.urgency)}>{item.urgency}</Badge>
                    </TableCell>
                    <TableCell>{Math.round(item.impact.confidence * 100)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
