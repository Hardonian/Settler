"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App route error", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6 bg-background-light dark:bg-background">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" aria-hidden="true" />
            <CardTitle>Unable to load app view</CardTitle>
          </div>
          <CardDescription>
            Something went wrong while loading this page. Your data is safe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error.digest ? (
            <p className="text-xs text-muted-foreground font-mono bg-muted/30 rounded px-2 py-1">
              Error ID: {error.digest}
            </p>
          ) : null}
          <div className="flex gap-2">
            <Button onClick={reset}>Try again</Button>
            <Button asChild variant="outline">
              <Link href="/app">Back to app</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
