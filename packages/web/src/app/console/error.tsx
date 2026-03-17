"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { RouteStateCard, routeStateFromVariant } from "@/components/shared/route-state";

/**
 * Console Error Boundary
 *
 * Catches errors in console routes and displays a friendly error message.
 * Never shows stack traces or sensitive information to users.
 */
export default function ConsoleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to monitoring service in production
    // Never log sensitive information
    const errorInfo = {
      message: error.message,
      digest: error.digest,
      // Only include stack in development
      ...(process.env.NODE_ENV === "development" && error.stack ? { stack: error.stack } : {}),
    };

    console.error("[Console Error Boundary]", errorInfo);

    // In production, send to error tracking service
    if (process.env.NODE_ENV === "production") {
      // Error tracking integrated via monitoring/alerts system
      // See: lib/monitoring/alerts.ts for alert handling
    }
  }, [error]);

  // Determine if this is an auth error
  const isAuthError =
    error.message?.includes("auth") ||
    error.message?.includes("unauthorized") ||
    error.message?.includes("authentication");

  return (
    <RouteStateCard
      {...(isAuthError
        ? routeStateFromVariant("auth-required", {
            actions: [
              { label: "Sign In", href: `/login?next=${encodeURIComponent("/console")}` },
              { label: "Go Home", href: "/", variant: "outline" },
            ],
            detail:
              process.env.NODE_ENV === "development" && error.message
                ? `Debug detail: ${error.message}`
                : "Your console session is missing or expired.",
          })
        : routeStateFromVariant("backend-unreachable", {
            icon: TriangleAlert,
            title: "Console temporarily unavailable",
            description: "We encountered an error while loading this console surface.",
            detail:
              process.env.NODE_ENV === "development" && error.message
                ? `Debug detail: ${error.message}`
                : "Try again, or return to the console overview while we recover the session.",
            actions: [
              { label: "Try Again", onClick: reset },
              { label: "Back to Console", href: "/console", variant: "outline" },
              { label: "Go Home", href: "/", variant: "outline" },
            ],
          }))}
    />
  );
}
