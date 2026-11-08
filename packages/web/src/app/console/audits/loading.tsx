/**
 * Audits Loading State
 *
 * Pixel-matching zero-CLS streaming skeleton that mirrors the Audits surface page.
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AuditsLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading audit workflows">
      {/* Page Header Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-3 w-40 max-w-full" />
        <Skeleton className="h-8 w-48 max-w-full sm:h-9" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>

      {/* Audit Surfaces Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-border/60">
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-4 w-full max-w-md" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-36 rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
