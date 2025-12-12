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

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // Ensure Node.js runtime for Prisma binary engine

export default async function ConsoleRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Environment safety check
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
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

    // If user is not authenticated, show public overview instead of redirecting
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

    return (
      <>
        <Navigation />
        <ConsoleLayout>{children}</ConsoleLayout>
        <Footer />
      </>
    );
  } catch (error) {
    // Log error for debugging
    console.error('[Console Layout] Auth error:', error);
    
    // Show public overview on error instead of crashing
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
