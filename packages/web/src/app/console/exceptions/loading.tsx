/**
 * Exceptions Loading State
 *
 * Pixel-matching zero-CLS streaming skeleton that mirrors the Exceptions operator console.
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ExceptionsLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading exceptions queue">
      {/* Page Header Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-3 w-40 max-w-full" />
        <Skeleton className="h-8 w-64 max-w-full sm:h-9" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>

      {/* Triage & Cluster Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-border/60">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-3 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter Toolbar Skeleton */}
      <Card className="border-border/60">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Skeleton className="h-9 w-72 rounded-md" />
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Skeleton className="h-9 w-28 rounded-md" />
              <Skeleton className="h-9 w-28 rounded-md" />
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exceptions Table Skeleton */}
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="divide-y divide-border/20">
            {/* Table Header */}
            <div className="h-10 bg-muted/25 flex items-center px-4 gap-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-16 ml-auto" />
            </div>
            {/* Table Rows */}
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 flex items-center px-4 gap-4">
                <Skeleton className="h-5 w-20 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-72" />
                </div>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-20 rounded-md ml-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
