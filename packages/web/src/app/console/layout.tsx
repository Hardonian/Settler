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
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { headers } from 'next/headers';

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
  
  
  // Environment safety check
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Console Layout] Missing Supabase configuration', logContext);
    // In production, show a clean error page instead of crashing
    if (process.env.NODE_ENV === 'production') {
      return (
        <>
          <Navigation />
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Configuration issue: Supabase is not properly configured.
              </p>
              <Button asChild>
                <Link href="/">Go Home</Link>
              </Button>
            </div>
          </div>
          <Footer />
        </>
      );
    }
    // In development, redirect to signup
    redirect('/signup?error=config_required');
  }

  try {
    // Check authentication
    const supabase = await createClient();
    const authResult = await supabase.auth.getUser();
    const { data: { user }, error } = authResult;
    
    if (error) {
      console.warn('[Console Layout] Auth check failed', {
        ...logContext,
        error: error.message,
        code: error.status,
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
    if (error || !user) {
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
