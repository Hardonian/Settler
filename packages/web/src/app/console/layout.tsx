/**
 * Console Layout
 * 
 * Wraps all console pages with the console layout and navigation.
 * All console routes require authentication.
 */

import { ConsoleLayout } from '@/components/console/ConsoleLayout';
import { ConsolePublicOverview } from '@/components/console/ConsolePublicOverview';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { createClient } from '@/lib/supabase/server';
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

  try {
    // Check authentication with timeout to prevent hanging
    let supabase;
    let authResult;
    let user;
    let authError;
    
    try {
      supabase = await createClient();
      // Wrap auth check in timeout
      authResult = await Promise.race([
        supabase.auth.getUser(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Auth check timeout')), 10000)
        ),
      ]);
      
      user = authResult.data?.user;
      authError = authResult.error;
    } catch (authCheckError) {
      console.warn('[Console Layout] Auth check failed', {
        ...logContext,
        error: authCheckError instanceof Error ? authCheckError.message : 'Unknown error',
      });
      authError = authCheckError as any;
      user = null;
    }
    
    if (authError) {
      console.warn('[Console Layout] Auth check failed', {
        ...logContext,
        error: authError instanceof Error ? authError.message : authError?.message || 'Unknown error',
        code: authError?.status,
      });
    } else if (user) {
      console.log('[Console Layout] User authenticated', {
        ...logContext,
        userId: user.id,
      });
    } else {
      console.log('[Console Layout] No authenticated user', logContext);
    }

    // If user is not authenticated, show public overview
    // Note: Playground routes have their own layout that handles unauthenticated access
    if (authError || !user) {
      return (
        <>
          <Navigation />
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <ConsolePublicOverview />
            </div>
          </div>
          <Footer />
        </>
      );
    }

    // Authenticated users get full console access
    return (
      <>
        <Navigation />
        <ConsoleLayout>{children}</ConsoleLayout>
        <Footer />
      </>
    );
  } catch (error) {
    // Log error for debugging (server-side only, no secrets)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const duration = Date.now() - startTime;
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('[Console Layout] Error', {
      ...logContext,
      error: errorMessage,
      duration,
      // Only log stack in development
      ...(process.env.NODE_ENV === 'development' && errorStack ? { stack: errorStack } : {}),
    });
    
    // Show public overview on error instead of crashing
    // This ensures the route never returns 500, even on unexpected errors
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <ConsolePublicOverview />
          </div>
        </div>
        <Footer />
      </>
    );
  }
}
