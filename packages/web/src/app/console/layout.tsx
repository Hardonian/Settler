/**
 * Console Layout
 * 
 * Wraps all console pages with the console layout and navigation.
 * Allows unauthenticated users to see a free view with upsell triggers.
 * Authenticated users without subscription see upgrade prompts.
 * 
 * CRITICAL: This layout allows public access but gates features based on auth/subscription.
 * Unauthenticated users see free view with sign-up CTAs.
 * Authenticated users without subscription see upgrade prompts.
 */

import { ConsoleLayout } from '@/components/console/ConsoleLayout';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { getConsoleAccessStatus } from '@/lib/auth/console-gate';
import { validateSupabaseEnv } from '@/lib/env/validator';
import { EnvErrorPanel } from '@/components/env/EnvErrorPanel';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Prisma binary engine

export default async function ConsoleRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const startTime = Date.now();
  const logContext = {
    route: '/console/layout',
    timestamp: new Date().toISOString(),
  };
  
  try {
    // Environment safety check using validator
    const envValidation = validateSupabaseEnv();
    if (!envValidation.isValid) {
      console.warn('[Console Layout] Missing Supabase configuration', {
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
      console.log('[Console Layout] Access status:', {
        ...logContext,
        reason: accessStatus.reason,
        allowed: false,
      });
    }

    // Always render the console layout - pages will handle their own gating
    // Unauthenticated users will see free view with upsell triggers
    // Authenticated users without subscription will see upgrade prompts
    return (
      <>
        <Navigation />
        <ConsoleLayout>{children}</ConsoleLayout>
        <Footer />
      </>
    );
  } catch (error) {
    // Log unexpected errors for debugging (server-side only, no secrets)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const duration = Date.now() - startTime;
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('[Console Layout] Unexpected error', {
      ...logContext,
      error: errorMessage,
      duration,
      // Only log stack in development
      ...(process.env.NODE_ENV === 'development' && errorStack ? { stack: errorStack } : {}),
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
