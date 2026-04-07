"use client";

import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

/**
 * Signup Error Boundary
 *
 * Critical auth flow error handler.
 * Must never leave users unable to sign up or sign in.
 */
export default function SignupError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Signup Error]", {
      message: error.message,
      digest: error.digest,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}),
    });

    // Track auth errors in production
    if (process.env.NODE_ENV === "production" && typeof window !== "undefined") {
      try {
        fetch("/api/admin/exceptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "auth_error",
            message: error.message,
            digest: error.digest,
            url: window.location.href,
          }),
        }).catch(() => {
          // Silently fail
        });
      } catch {
        // Ignore tracking errors
      }
    }
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" aria-hidden="true" />
            <CardTitle>Sign Up Unavailable</CardTitle>
          </div>
          <CardDescription>
            We're having trouble loading the sign-up page right now.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This is likely a temporary issue. Please try one of the options below:
          </p>

          <div className="flex gap-2 flex-col">
            <Button onClick={reset} variant="default" className="w-full">
              Reload Page
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Return Home</Link>
            </Button>
          </div>

          <div className="border-t pt-4 space-y-2">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              <strong>Already have an account?</strong>
            </p>
            <Button asChild variant="link" className="p-0 h-auto">
              <Link href="/signup">Try signing in instead</Link>
            </Button>
          </div>

          <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground">
            <p className="font-medium mb-1">Still having trouble?</p>
            <p>
              Email us at{" "}
              <a href="mailto:hello@settler.dev" className="text-primary underline">
                hello@settler.dev
              </a>
            </p>
            {error.digest && (
              <p className="mt-2 text-muted-foreground">Error Reference: {error.digest}</p>
            )}
          </div>

          {process.env.NODE_ENV === "development" && error.message && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
              <p className="text-xs font-mono text-destructive break-words">{error.message}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
