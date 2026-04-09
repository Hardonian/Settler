"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function ConsoleRunsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service
    console.error("[ConsoleRunsError]", error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <Card className="max-w-md p-6">
        <div className="flex flex-col items-center text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Failed to Load Reconciliation Runs</h2>
          <p className="text-sm text-muted-foreground mb-6">
            We encountered an error while loading your reconciliation runs. This may be due to a
            network issue or a temporary server problem.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground mb-4">Error ID: {error.digest}</p>
          )}
          <div className="flex gap-2">
            <Button onClick={reset} variant="default">
              Try Again
            </Button>
            <Button onClick={() => (window.location.href = "/console")} variant="outline">
              Go to Console
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
