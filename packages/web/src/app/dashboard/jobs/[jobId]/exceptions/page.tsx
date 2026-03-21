"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Loader2, ArrowLeft, CheckCircle2, Filter, Search, RefreshCw } from "lucide-react";
import Link from "next/link";
import { logger } from "@/lib/logging/logger";

interface Exception {
  id: string;
  runId: string;
  sourceTransactionId: string;
  targetTransactionId: string | null;
  matchType: string;
  confidence: number;
  matchReason: string | null;
  amountDiff: number | null;
  dateDiff: number | null;
  reviewed: boolean;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  sourceTransaction: {
    id: string;
    amount: number;
    currency: string;
    date: Date;
    description: string | null;
    externalId: string | null;
  };
  targetTransaction: {
    id: string;
    amount: number;
    currency: string;
    date: Date;
    description: string | null;
    externalId: string | null;
  } | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

interface ExceptionsResponse {
  exceptions: Exception[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  summary: {
    totalUnmatched: number;
    totalConflicts: number;
    totalReviewed: number;
    totalUnreviewed: number;
  };
}

export default function ExceptionsPage() {
  const params = useParams();
  const jobId = params?.jobId as string | undefined;

  const [exceptions, setExceptions] = useState<Exception[]>([]);
  const [summary, setSummary] = useState<ExceptionsResponse["summary"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [matchTypeFilter, setMatchTypeFilter] = useState<string>("all");
  const [reviewedFilter, setReviewedFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExceptions, setSelectedExceptions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (jobId) {
      void fetchExceptions();
    }
  }, [jobId, matchTypeFilter, reviewedFilter]);

  const fetchExceptions = async () => {
    if (!jobId) return;

    try {
      setIsLoading(true);

      const params = new URLSearchParams();
      params.append("matchType", matchTypeFilter);
      params.append("reviewed", reviewedFilter);
      params.append("limit", "100");
      params.append("offset", "0");

      const response = await fetch(`/api/jobs/${jobId}/exceptions?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch exceptions: ${response.statusText}`);
      }

      const data: ExceptionsResponse = await response.json();
      setExceptions(data.exceptions);
      setSummary(data.summary);
    } catch (error) {
      logger.error(
        "Failed to fetch exceptions",
        error instanceof Error ? error : new Error(String(error)),
        { jobId }
      );
      setExceptions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewException = async (
    exceptionId: string,
    action: "review" | "match" | "mark_expected"
  ) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/exceptions/${exceptionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          reviewed: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update exception: ${response.statusText}`);
      }

      // Refresh exceptions
      await fetchExceptions();
    } catch (error) {
      logger.error(
        "Failed to review exception",
        error instanceof Error ? error : new Error(String(error)),
        { exceptionId }
      );
      alert("Failed to update exception. Please try again.");
    }
  };

  const handleBulkReview = async (action: "review" | "mark_expected") => {
    try {
      const promises = Array.from(selectedExceptions).map((exceptionId) =>
        fetch(`/api/jobs/${jobId}/exceptions/${exceptionId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            reviewed: true,
          }),
        })
      );

      await Promise.all(promises);
      setSelectedExceptions(new Set());
      await fetchExceptions();
    } catch (error) {
      logger.error(
        "Failed to bulk review exceptions",
        error instanceof Error ? error : new Error(String(error))
      );
      alert("Failed to update exceptions. Please try again.");
    }
  };

  const filteredExceptions = exceptions.filter((exception) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        exception.sourceTransaction.description?.toLowerCase().includes(query) ||
        exception.sourceTransaction.externalId?.toLowerCase().includes(query) ||
        exception.targetTransaction?.description?.toLowerCase().includes(query) ||
        exception.targetTransaction?.externalId?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  if (!jobId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-blue-50/30 to-indigo-50/30 dark:from-background dark:via-muted/20 dark:to-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">Invalid job ID</p>
                <Button asChild>
                  <Link href="/dashboard/jobs">Back to Jobs</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-blue-50/30 to-indigo-50/30 dark:from-background dark:via-muted/20 dark:to-background">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/dashboard/jobs/${jobId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Job
            </Link>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Exceptions Review
            </h1>
            <p className="text-muted-foreground">
              Review and resolve unmatched transactions and conflicts
            </p>
          </div>
          <div className="flex gap-2">
            {selectedExceptions.size > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={() => handleBulkReview("review")}>
                  Mark Selected as Reviewed
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkReview("mark_expected")}
                >
                  Mark Selected as Expected
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={() => fetchExceptions()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Unmatched</CardDescription>
                <CardTitle className="text-2xl md:text-3xl text-amber-600 dark:text-amber-400">
                  {summary.totalUnmatched}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Conflicts</CardDescription>
                <CardTitle className="text-2xl md:text-3xl text-red-600 dark:text-red-400">
                  {summary.totalConflicts}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Reviewed</CardDescription>
                <CardTitle className="text-2xl md:text-3xl text-green-600 dark:text-green-400">
                  {summary.totalReviewed}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Pending Review</CardDescription>
                <CardTitle className="text-2xl md:text-3xl text-foreground">
                  {summary.totalUnreviewed}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={matchTypeFilter}
              onChange={(e) => setMatchTypeFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
            >
              <option value="all">All Types</option>
              <option value="unmatched">Unmatched</option>
              <option value="conflict">Conflicts</option>
            </select>
            <select
              value={reviewedFilter}
              onChange={(e) => setReviewedFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
            >
              <option value="all">All Status</option>
              <option value="false">Unreviewed</option>
              <option value="true">Reviewed</option>
            </select>
          </div>
        </div>

        {/* Exceptions List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredExceptions.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  {searchQuery || matchTypeFilter !== "all" || reviewedFilter !== "all"
                    ? "No exceptions found matching your filters"
                    : "No exceptions found"}
                </p>
                <Button asChild variant="outline">
                  <Link href={`/dashboard/jobs/${jobId}`}>Back to Job</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredExceptions.map((exception) => (
              <Card
                key={exception.id}
                className={`hover:shadow-lg transition-shadow ${
                  exception.reviewed ? "opacity-75" : ""
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedExceptions.has(exception.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedExceptions);
                        if (e.target.checked) {
                          newSelected.add(exception.id);
                        } else {
                          newSelected.delete(exception.id);
                        }
                        setSelectedExceptions(newSelected);
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge
                          className={
                            exception.matchType === "conflict"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          }
                        >
                          {exception.matchType}
                        </Badge>
                        {exception.reviewed && (
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            Reviewed
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground">
                          Confidence: {Math.round(exception.confidence * 100)}%
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">Source Transaction</h4>
                          <div className="text-sm space-y-1">
                            <p>
                              <span className="font-medium">Amount:</span>{" "}
                              {exception.sourceTransaction.amount.toFixed(2)}{" "}
                              {exception.sourceTransaction.currency}
                            </p>
                            <p>
                              <span className="font-medium">Date:</span>{" "}
                              {new Date(exception.sourceTransaction.date).toLocaleDateString()}
                            </p>
                            <p>
                              <span className="font-medium">Description:</span>{" "}
                              {exception.sourceTransaction.description || "N/A"}
                            </p>
                            {exception.sourceTransaction.externalId && (
                              <p>
                                <span className="font-medium">ID:</span>{" "}
                                {exception.sourceTransaction.externalId}
                              </p>
                            )}
                          </div>
                        </div>

                        {exception.targetTransaction ? (
                          <div>
                            <h4 className="font-semibold text-foreground mb-2">
                              Target Transaction
                            </h4>
                            <div className="text-sm space-y-1">
                              <p>
                                <span className="font-medium">Amount:</span>{" "}
                                {exception.targetTransaction.amount.toFixed(2)}{" "}
                                {exception.targetTransaction.currency}
                              </p>
                              <p>
                                <span className="font-medium">Date:</span>{" "}
                                {new Date(exception.targetTransaction.date).toLocaleDateString()}
                              </p>
                              <p>
                                <span className="font-medium">Description:</span>{" "}
                                {exception.targetTransaction.description || "N/A"}
                              </p>
                              {exception.targetTransaction.externalId && (
                                <p>
                                  <span className="font-medium">ID:</span>{" "}
                                  {exception.targetTransaction.externalId}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <h4 className="font-semibold text-foreground mb-2">
                              No Target Transaction
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              This transaction has no matching target transaction.
                            </p>
                          </div>
                        )}
                      </div>

                      {exception.amountDiff !== null && (
                        <div className="mb-4">
                          <p className="text-sm">
                            <span className="font-medium">Amount Difference:</span>{" "}
                            <span
                              className={
                                Math.abs(exception.amountDiff) > 0.01
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-green-600 dark:text-green-400"
                              }
                            >
                              {exception.amountDiff > 0 ? "+" : ""}
                              {exception.amountDiff.toFixed(2)}
                            </span>
                          </p>
                        </div>
                      )}

                      {!exception.reviewed && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReviewException(exception.id, "review")}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Mark as Reviewed
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReviewException(exception.id, "mark_expected")}
                          >
                            Mark as Expected
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
