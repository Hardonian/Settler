/**
 * Console Layout
 *
 * Wraps all console pages with the console layout and navigation.
 * Middleware enforces authentication for /console routes.
 * Authenticated users without subscription see upgrade prompts.
 *
 * CRITICAL: This layout handles error states gracefully without hard 500s.
 * Authenticated users without subscription see upgrade prompts.
 */

import { ConsoleLayout } from "@/components/console/ConsoleLayout";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { getConsoleAccessStatus } from "@/lib/auth/console-gate";
import { validateSupabaseEnv } from "@/lib/env/validator";
import { EnvErrorPanel } from "@/components/env/EnvErrorPanel";
import { appLogger } from "@/lib/utils/logger";
import { ErrorBoundary } from "@/components/shared/error-boundary";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // Ensure Node.js runtime for Prisma binary engine

export default async function ConsoleRootLayout({ children }: { children: React.ReactNode }) {
  const startTime = Date.now();
  const logContext = {
    route: "/console/layout",
    timestamp: new Date().toISOString(),
  };

  try {
    // Environment safety check using validator
    const envValidation = validateSupabaseEnv();
    if (!envValidation.isValid) {
      appLogger.warn("[Console Layout] Missing Supabase configuration", {
        ...logContext,
        missingVars: envValidation.missing,
      });
      // Show clean error page instead of crashing
      return (
        <>
          <Navigation />
          <EnvErrorPanel missingVars={envValidation.missing} />
          <Footer />
        </>
      );
    }

    // Check console access status (doesn't redirect, just returns status)
    // This allows unauthenticated users to see the free view
    const accessStatus = await getConsoleAccessStatus();

    // Log access status for monitoring
    if (!accessStatus.allowed) {
      appLogger.info("[Console Layout] Access status", {
        ...logContext,
        reason: accessStatus.reason,
        allowed: false,
      });
    }

    // Always render the console layout - pages will handle their own gating
    // Unauthenticated users will see free view with upsell triggers
    // Authenticated users without subscription will see upgrade prompts
    return (
      <ErrorBoundary context="Console Layout">
        <Navigation />
        <ConsoleLayout>{children}</ConsoleLayout>
        <Footer />
      </ErrorBoundary>
    );
  } catch (err) {
    // Log unexpected errors for debugging (server-side only, no secrets)
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    const duration = Date.now() - startTime;
    const errorStack = err instanceof Error ? err.stack : undefined;

    appLogger.error("[Console Layout] Unexpected error", err, {
      ...logContext,
      errorMessage,
      duration,
      // Only log stack in development
      ...(process.env.NODE_ENV === "development" && errorStack ? { stack: errorStack } : {}),
    });

    // Show friendly error page instead of crashing
    // This ensures the route never returns 500, even on unexpected errors
    // Still allow users to see the console with error state
    return (
      <>
        <Navigation />
        <ConsoleLayout>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Console Temporarily Unavailable
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
                We're experiencing technical difficulties. Please try again in a moment.
              </p>
              <div className="flex gap-4 justify-center">
                <a
                  href="/signup"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Sign In
                </a>
                <a
                  href="/"
                  className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Go Home
                </a>
              </div>
            </div>
          </div>
        </ConsoleLayout>
        <Footer />
      </>
    );
  }
}
