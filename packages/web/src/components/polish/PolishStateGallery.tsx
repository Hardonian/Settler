/**
 * PolishStateGallery
 *
 * Fast visual review of common UI states (loading / empty / error) without
 * needing to navigate flows or induce failures.
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";

type StateMode = "normal" | "loading" | "empty" | "error";

export function PolishStateGallery() {
  const [mode, setMode] = useState<StateMode>("normal");

  return (
    <Card>
      <CardHeader>
        <CardTitle>UI State Gallery</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {(["normal", "loading", "empty", "error"] as const).map((m) => (
            <Button
              key={m}
              variant={mode === m ? "default" : "outline"}
              size="sm"
              onClick={() => setMode(m)}
            >
              {m}
            </Button>
          ))}
        </div>

        <div className="border rounded-[var(--ui-radius-lg)] p-4 bg-white dark:bg-slate-950">
          {mode === "normal" && (
            <div className="space-y-3">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Normal state sample content
              </div>
              <div className="flex flex-wrap gap-2">
                <Button>Primary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button loading>Loading</Button>
              </div>
            </div>
          )}

          {mode === "loading" && (
            <div className="space-y-3">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
          )}

          {mode === "empty" && (
            <EmptyState
              title="No results"
              description="This is what an empty list looks like with current spacing, radius, and typography."
              action={{ label: "Create", onClick: () => {} }}
              secondaryAction={{ label: "Learn more", onClick: () => {} }}
            />
          )}

          {mode === "error" && (
            <ErrorState
              title="Something went wrong"
              error="This is a representative error state. Copy and layout should remain calm and actionable."
              showRetry
              onRetry={() => {}}
              showSupport
              supportAction={() => {}}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
