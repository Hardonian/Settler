"use client";

import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Search } from "lucide-react";
import Link from "next/link";

/**
 * Documentation Error Boundary
 *
 * Graceful degradation for documentation errors.
 * Provides alternative navigation and search options.
 */
export default function DocsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.warn("[Docs Error]", {
      message: error.message,
      digest: error.digest,
      ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}),
    });
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <CardTitle>Documentation Page Error</CardTitle>
          </div>
          <CardDescription>We couldn't load this documentation page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            The page you&apos;re looking for might have been moved, or there could be a temporary
            issue.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button onClick={reset} variant="default" className="w-full">
              Try Again
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/docs">
                <BookOpen className="w-4 h-4 mr-2" />
                Documentation Home
              </Link>
            </Button>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">Popular Documentation:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button asChild variant="ghost" size="sm" className="justify-start">
                <Link href="/docs/getting-started">Getting Started</Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="justify-start">
                <Link href="/docs/api">API Reference</Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="justify-start">
                <Link href="/docs/sdk">SDK Documentation</Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="justify-start">
                <Link href="/docs/examples">Examples</Link>
              </Button>
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Search className="h-5 w-5 text-muted-foreground mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium mb-1">Can&apos;t find what you need?</p>
                <p className="text-xs text-muted-foreground">
                  Try our{" "}
                  <Link href="/docs" className="text-primary hover:underline">
                    documentation search
                  </Link>{" "}
                  or{" "}
                  <a href="mailto:hello@settler.dev" className="text-primary hover:underline">
                    contact support
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>

          {process.env.NODE_ENV === "development" && error.message && (
            <div className="bg-muted/30 border border-border rounded-lg p-3">
              <p className="text-xs font-mono text-foreground break-words">{error.message}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
