"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useWorkspaceInvestigationDetail } from "@/hooks/use-workspace-investigation-detail";
import { SkeletonCard } from "@/components/shared/loading-state";

interface WorkspaceInvestigationDetailClientProps {
  ingestionId: string;
}

export function WorkspaceInvestigationDetailClient({
  ingestionId,
}: WorkspaceInvestigationDetailClientProps) {
  const { investigation, setFilters, isLoading, error, refresh } =
    useWorkspaceInvestigationDetail(ingestionId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Error loading investigation: {error.message}</p>
        <Button variant="outline" onClick={refresh}>
          Try again
        </Button>
      </div>
    );
  }

  if (!investigation) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No investigation found</p>
        <Button variant="outline" asChild>
          <Link href="/workspace">Go to Workspace</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/workspace">
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Investigation Details</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refresh}>
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Investigation #{investigation.id}</CardTitle>
              <CardDescription>{investigation.description}</CardDescription>
            </div>
            <Badge>{investigation.status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-muted rounded p-4">
              <p className="text-xs text-muted-foreground font-medium">Total Transactions</p>
              <p className="text-2xl font-bold text-foreground">
                {investigation.totalTransactions}
              </p>
            </div>
            <div className="bg-muted rounded p-4">
              <p className="text-xs text-muted-foreground font-medium">Matched</p>
              <p className="text-2xl font-bold text-foreground">
                {investigation.matchedTransactions}
              </p>
            </div>
            <div className="bg-muted rounded p-4">
              <p className="text-xs text-muted-foreground font-medium">Mismatched</p>
              <p className="text-2xl font-bold text-foreground">
                {investigation.mismatchedTransactions}
              </p>
            </div>
            <div className="bg-muted rounded p-4">
              <p className="text-xs text-muted-foreground font-medium">Requires Review</p>
              <p className="text-2xl font-bold text-foreground">
                {investigation.requiresReviewTransactions}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
