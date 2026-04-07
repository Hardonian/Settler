"use client";

import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import Link from "next/link";

/**
 * Billing Error Boundary
 *
 * Catches errors in billing routes and provides recovery options.
 * Critical path - must never leave user in broken state.
 */
export default function BillingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log billing errors with high priority
    console.error("[Billing Error]", {
      message: error.message,
      digest: error.digest,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === "development" && error.stack ? { stack: error.stack } : {}),
    });

    // Track billing errors in production
    if (process.env.NODE_ENV === "production" && typeof window !== "undefined") {
      // Send to monitoring service
      try {
        fetch("/api/admin/exceptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "billing_error",
            message: error.message,
            digest: error.digest,
            url: window.location.href,
          }),
        }).catch(() => {
          // Silently fail - don't block user
        });
      } catch {
        // Ignore tracking errors
      }
    }
  }, [error]);

  const isPaymentError =
    error.message?.includes("payment") ||
    error.message?.includes("card") ||
    error.message?.includes("stripe");

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-orange-600" aria-hidden="true" />
            <CardTitle>Billing System Error</CardTitle>
          </div>
          <CardDescription>
            {isPaymentError
              ? "We encountered an issue processing your payment information."
              : "There was an error loading the billing dashboard."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === "development" && error.message && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
              <p className="text-xs font-mono text-orange-800 dark:text-orange-200 break-words">
                {error.message}
              </p>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">
              Your billing data is safe
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              No charges have been made. You can safely try again or contact support.
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={reset} variant="default">
              Try Again
            </Button>
            <Button asChild variant="outline">
              <Link href="/console">Back to Console</Link>
            </Button>
            <Button asChild variant="outline">
              <a href="mailto:hello@settler.dev">Contact Support</a>
            </Button>
          </div>

          {error.digest && (
            <p className="text-xs text-muted-foreground">Error ID: {error.digest}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
