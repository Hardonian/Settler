"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, RotateCcw, Search, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useReconciliationQueue } from "@/hooks/use-reconciliation-queue";
import { SkeletonTableRow } from "@/components/shared/loading-state";

export function ReconciliationQueueClient() {
  const { queue, setFilters, isLoading, error, refresh, startReconciliation } =
    useReconciliationQueue();

  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setFilters((prev: any) => ({ ...prev, search: e.target.value }));
  };

  const handleStartReconciliation = async () => {
    try {
      await startReconciliation();
      await refresh();
    } catch (_err) {
      // Handle error
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <SkeletonTableRow key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Error loading reconciliation queue: {error.message}</p>
        <Button variant="outline" onClick={refresh}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search runs..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10 pr-4 py-2 border border-input bg-background rounded-md shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleStartReconciliation}>
            <Play className="mr-2 h-4 w-4" />
            Start Run
          </Button>
          <Button variant="outline" onClick={refresh}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{queue.totalRuns}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{queue.activeRuns}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{queue.completedToday}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Failed Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{queue.failedRuns}</p>
          </CardContent>
        </Card>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Run ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead className="text-right">Records</TableHead>
              <TableHead className="text-right">Matches</TableHead>
              <TableHead className="text-right">Mismatches</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queue.recentRuns.map((run) => (
              <TableRow key={run.id}>
                <TableCell className="font-medium">#{run.id}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      run.status === "Completed"
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {run.status}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">{run.startTime}</TableCell>
                <TableCell className="text-right font-mono">{run.records}</TableCell>
                <TableCell className="text-right text-green-600 font-mono">{run.matches}</TableCell>
                <TableCell className="text-right text-red-600 font-mono">
                  {run.mismatches}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
