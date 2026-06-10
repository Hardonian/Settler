/**
 * Reconciliation Matches Component
 * Displays reconciliation matches with review capabilities
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { capabilitiesForRunKind, type ReconciliationRunKind } from "@settler/reconciliation-core";
import type { OperatorRunDetail } from "@/types/operator-run-detail";
import { FreezeErrorAlert } from "@/components/shared/FreezeErrorAlert";
import { useGovernanceState } from "@/hooks/use-governance-state";
import {
  getGovernanceRecoveryHref,
  parseGovernanceFreezeError,
  type GovernanceFreezeErrorDetails,
} from "@/lib/governance/freeze-client";
import { parseOperatorRunDetailResponse } from "@/lib/runs/operator-run-detail";

interface Match {
  id: string;
  matchType: "exact" | "fuzzy" | "manual" | "unmatched";
  confidence: number;
  matchReason: string | null;
  amountDiff: number | null;
  dateDiff: number | null;
  reviewed: boolean;
  source: {
    id: string;
    amount: number;
    currency: string;
    date: string;
    description: string | null;
    externalId: string | null;
  };
  target: {
    id: string;
    amount: number;
    currency: string;
    date: string;
    description: string | null;
    externalId: string | null;
  } | null;
}

interface ReconciliationMatchesProps {
  runId: string;
  /** When known (e.g. from canonical list/detail), avoids a detail prefetch before matches. */
  runKind?: ReconciliationRunKind | null;
}

type LoadBlockReason =
  | null
  | { kind: "wrong_run_kind" }
  | { kind: "uuid_collision"; detail: string }
  | { kind: "not_found" }
  | { kind: "other"; message: string };

export function ReconciliationMatches({ runId, runKind: runKindProp }: ReconciliationMatchesProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "matched" | "unmatched" | "unreviewed">("all");
  const [resolvedRunKind, setResolvedRunKind] = useState<ReconciliationRunKind | null>(
    runKindProp ?? null
  );
  const [blockReason, setBlockReason] = useState<LoadBlockReason>(null);
  const [freezeError, setFreezeError] = useState<GovernanceFreezeErrorDetails | null>(null);
  const { isFrozen, governanceState } = useGovernanceState();

  useEffect(() => {
    setResolvedRunKind(runKindProp ?? null);
    setBlockReason(null);
  }, [runId, runKindProp]);

  const loadMatches = useCallback(async () => {
    try {
      setLoading(true);
      setBlockReason(null);

      let runKind = resolvedRunKind;
      if (runKind == null) {
        const detailRes = await fetch(`/api/runs/${runId}`);

        if (detailRes.status === 404) {
          setBlockReason({ kind: "not_found" });
          setMatches([]);
          return;
        }

        if (detailRes.status === 409) {
          const problem = (await detailRes.json().catch(() => ({}))) as {
            code?: string;
            detail?: string;
            error?: string;
          };
          setBlockReason({
            kind: "uuid_collision",
            detail:
              problem.detail ||
              problem.error ||
              "This id exists as both a recon job and an ingestion reconciliation run.",
          });
          setMatches([]);
          return;
        }

        if (!detailRes.ok) {
          setBlockReason({
            kind: "other",
            message: "Failed to load canonical run detail for matches.",
          });
          setMatches([]);
          return;
        }

        const detailBody = parseOperatorRunDetailResponse(
          (await detailRes.json()) as OperatorRunDetail
        );
        const k = detailBody.runKind;
        if (k !== "recon_job" && k !== "ingestion_run") {
          setBlockReason({ kind: "other", message: "Unexpected runKind in operator run detail." });
          setMatches([]);
          return;
        }
        runKind = k;
        setResolvedRunKind(runKind);
      }

      const caps = capabilitiesForRunKind(runKind);
      if (!caps.matches) {
        setBlockReason({ kind: "wrong_run_kind" });
        setMatches([]);
        return;
      }

      const params = new URLSearchParams();
      if (filter === "unmatched") {
        params.append("matchType", "unmatched");
      } else if (filter === "unreviewed") {
        params.append("reviewed", "false");
      }

      const response = await fetch(
        `/api/v1/reconciliation/runs/${runId}/matches?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("apiKey")}`,
          },
        }
      );

      if (response.status === 409) {
        const problem = (await response.json().catch(() => ({}))) as { code?: string };
        if (problem.code === "RECONCILIATION_WRONG_RUN_KIND") {
          setBlockReason({ kind: "wrong_run_kind" });
        } else {
          setBlockReason({ kind: "other", message: "Conflict loading matches." });
        }
        setMatches([]);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to load matches");
      }

      const data = await response.json();
      setMatches(data.matches || []);
    } catch (error: unknown) {
      console.error("Failed to load matches:", error);
      setBlockReason({
        kind: "other",
        message: error instanceof Error ? error.message : "Failed to load matches",
      });
    } finally {
      setLoading(false);
    }
  }, [runId, filter, resolvedRunKind]);

  useEffect(() => {
    void loadMatches();
  }, [loadMatches]);

  const toggleReviewed = async (matchId: string, reviewed: boolean) => {
    try {
      setFreezeError(null);
      const response = await fetch(`/api/v1/reconciliation/matches/${matchId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("apiKey")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reviewed: !reviewed }),
      });
      const payload = (await response.json().catch(() => null)) as unknown;
      const freezeDetails = parseGovernanceFreezeError(payload, response.status);

      if (freezeDetails) {
        setFreezeError(freezeDetails);
        return;
      }

      if (response.ok) {
        setMatches((prev) =>
          prev.map((m) => (m.id === matchId ? { ...m, reviewed: !reviewed } : m))
        );
      }
    } catch (error: unknown) {
      console.error("Failed to update match:", error);
    }
  };

  const getMatchTypeBadge = (type: string) => {
    switch (type) {
      case "exact":
        return <Badge className="bg-green-500">Exact</Badge>;
      case "fuzzy":
        return <Badge className="bg-yellow-500">Fuzzy</Badge>;
      case "manual":
        return <Badge className="bg-blue-500">Manual</Badge>;
      default:
        return <Badge className="bg-gray-500">Unmatched</Badge>;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return "text-green-600";
    if (confidence >= 0.7) return "text-yellow-600";
    return "text-red-600";
  };

  const blockedCopy = (() => {
    if (!blockReason) return null;
    if (blockReason.kind === "wrong_run_kind") {
      return {
        title: "Matches not available for this run type",
        body: "Row-level matches are stored on ingestion reconciliation runs (recon_results). Recon jobs use job results and the console results view instead—do not call the v1 matches route with a recon_job id.",
      };
    }
    if (blockReason.kind === "uuid_collision") {
      return {
        title: "Id collision",
        body: blockReason.detail,
      };
    }
    if (blockReason.kind === "not_found") {
      return {
        title: "Run not found",
        body: "No reconciliation run exists for this id in your tenant, or you do not have access.",
      };
    }
    return {
      title: "Unable to load matches",
      body: blockReason.message,
    };
  })();

  const matchedCount = matches.filter((m) => m.target !== null).length;
  const unmatchedCount = matches.filter((m) => m.target === null).length;
  const reviewedCount = matches.filter((m) => m.reviewed).length;
  const filtersDisabled = loading || Boolean(blockedCopy);
  const activeFreezeError =
    freezeError ??
    (isFrozen
      ? {
          message: "Review actions are currently blocked by tenant freeze.",
          reason: governanceState?.freeze_reason ?? null,
          frozenAt: governanceState?.frozen_at ?? null,
          traceId: null,
        }
      : null);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Reconciliation Matches</CardTitle>
            <CardDescription>
              {blockedCopy
                ? blockedCopy.title
                : `${matchedCount} matched, ${unmatchedCount} unmatched, ${reviewedCount} reviewed`}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              disabled={filtersDisabled}
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "matched" ? "default" : "outline"}
              size="sm"
              disabled={filtersDisabled}
              onClick={() => setFilter("matched")}
            >
              Matched
            </Button>
            <Button
              variant={filter === "unmatched" ? "default" : "outline"}
              size="sm"
              disabled={filtersDisabled}
              onClick={() => setFilter("unmatched")}
            >
              Unmatched
            </Button>
            <Button
              variant={filter === "unreviewed" ? "default" : "outline"}
              size="sm"
              disabled={filtersDisabled}
              onClick={() => setFilter("unreviewed")}
            >
              Unreviewed
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activeFreezeError ? (
          <FreezeErrorAlert
            className="mb-4"
            reason={activeFreezeError.reason}
            frozenAt={activeFreezeError.frozenAt ?? undefined}
            recoveryAction={{
              label: "Open Governance Controls",
              href: getGovernanceRecoveryHref(),
            }}
          />
        ) : null}
        {blockedCopy && !loading ? (
          <div className="flex gap-3 rounded-lg border border-border bg-muted/30 p-4 text-sm">
            <Info className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            <div>
              <p className="font-medium text-foreground">{blockedCopy.title}</p>
              <p className="mt-1 text-muted-foreground">{blockedCopy.body}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/console/runs/${runId}`}>Open run detail</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href="/console/reconciliations">Open results</Link>
                </Button>
              </div>
            </div>
          </div>
        ) : null}
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : !blockedCopy ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Match Type</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Amount Diff</TableHead>
                  <TableHead>Date Diff</TableHead>
                  <TableHead>Review</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-gray-500">
                      No matches found
                    </TableCell>
                  </TableRow>
                ) : (
                  matches.map((match) => (
                    <TableRow key={match.id}>
                      <TableCell>
                        {match.reviewed ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                        )}
                      </TableCell>
                      <TableCell>{getMatchTypeBadge(match.matchType)}</TableCell>
                      <TableCell>
                        <span className={getConfidenceColor(match.confidence)}>
                          {(match.confidence * 100).toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        {match.matchReason ? (
                          <span className="text-sm text-muted-foreground">{match.matchReason}</span>
                        ) : match.matchType === "unmatched" ? (
                          <span className="text-sm text-amber-600 dark:text-amber-400">
                            No matching transaction found. Check source data or adjust matching
                            rules.
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground/60">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            ${match.source.amount.toFixed(2)} {match.source.currency}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {new Date(match.source.date).toLocaleDateString()}
                          </div>
                          <div className="text-gray-500 text-xs truncate max-w-xs">
                            {match.source.description || "-"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {match.target ? (
                          <div className="text-sm">
                            <div className="font-medium">
                              ${match.target.amount.toFixed(2)} {match.target.currency}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {new Date(match.target.date).toLocaleDateString()}
                            </div>
                            <div className="text-gray-500 text-xs truncate max-w-xs">
                              {match.target.description || "-"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {match.amountDiff !== null ? (
                          <span
                            className={
                              match.amountDiff === 0 ? "text-green-600" : "text-yellow-600"
                            }
                          >
                            ${Math.abs(match.amountDiff).toFixed(2)}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {match.dateDiff !== null ? (
                          <span
                            className={match.dateDiff === 0 ? "text-green-600" : "text-yellow-600"}
                          >
                            {match.dateDiff} days
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={match.reviewed}
                          disabled={isFrozen}
                          onCheckedChange={() => toggleReviewed(match.id, match.reviewed)}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
