/**
 * Reconciliation Matches Component
 * Displays reconciliation matches with review capabilities
 */

"use client";

import { useState, useEffect } from "react";
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
import { AlertCircle, CheckCircle2 } from "lucide-react";

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
}

export function ReconciliationMatches({ runId }: ReconciliationMatchesProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "matched" | "unmatched" | "unreviewed">("all");

  useEffect(() => {
    loadMatches();
  }, [runId, filter]);

  const loadMatches = async () => {
    try {
      setLoading(true);
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

      if (!response.ok) {
        throw new Error("Failed to load matches");
      }

      const data = await response.json();
      setMatches(data.matches || []);
    } catch (error: unknown) {
      console.error("Failed to load matches:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleReviewed = async (matchId: string, reviewed: boolean) => {
    try {
      const response = await fetch(`/api/v1/reconciliation/matches/${matchId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("apiKey")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reviewed: !reviewed }),
      });

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

  const matchedCount = matches.filter((m: any) => m.target !== null).length;
  const unmatchedCount = matches.filter((m: any) => m.target === null).length;
  const reviewedCount = matches.filter((m: any) => m.reviewed).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Reconciliation Matches</CardTitle>
            <CardDescription>
              {matchedCount} matched, {unmatchedCount} unmatched, {reviewedCount} reviewed
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "matched" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("matched")}
            >
              Matched
            </Button>
            <Button
              variant={filter === "unmatched" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("unmatched")}
            >
              Unmatched
            </Button>
            <Button
              variant={filter === "unreviewed" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("unreviewed")}
            >
              Unreviewed
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
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
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {match.matchReason}
                          </span>
                        ) : match.matchType === 'unmatched' ? (
                          <span className="text-sm text-amber-600 dark:text-amber-400">
                            No matching transaction found. Check source data or adjust matching rules.
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
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
                          onCheckedChange={() => toggleReviewed(match.id, match.reviewed)}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
