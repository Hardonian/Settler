/**
 * Console Layout
 * 
 * Wraps all console pages with the console layout and navigation.
 * All console routes require authentication and subscription.
 * 
 * CRITICAL: This layout enforces server-side auth + subscription gating.
 * Unauthenticated users are redirected to sign-in.
 * Users without subscription are redirected to pricing.
 */

import { ConsoleLayout } from '@/components/console/ConsoleLayout';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { requireConsoleAccess } from '@/lib/auth/console-gate';
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

    // CRITICAL: Server-side auth + subscription gate
    // This will redirect unauthenticated users to sign-in
    // and non-subscribers to pricing
    // If access is allowed, this returns null (doesn't throw)
    try {
      await requireConsoleAccess();
    } catch (redirectError) {
      // requireConsoleAccess uses redirect() which throws NextResponse
      // This is expected behavior - re-throw redirects
      if (redirectError && typeof redirectError === 'object' && 'digest' in redirectError) {
        throw redirectError; // Re-throw Next.js redirects
      }
      // If it's not a redirect, log and continue to show error page
      console.error('[Console Layout] requireConsoleAccess failed:', redirectError);
      throw redirectError; // Re-throw to be caught by outer catch
    }

    // If we reach here, user is authenticated and has subscription
    // Render the console layout
    return (
      <>
        <Navigation />
        <ConsoleLayout>{children}</ConsoleLayout>
        <Footer />
      </>
    );
  } catch (error) {
    // requireConsoleAccess uses redirect() which throws NextResponse
    // This is expected behavior - re-throw redirects
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error; // Re-throw Next.js redirects
    }
    
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
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black">
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
        </div>
        <Footer />
      </>
    );
  }
}
