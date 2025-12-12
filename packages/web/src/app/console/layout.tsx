/**
 * Console Layout
 * 
 * Wraps all console pages with the console layout and navigation.
 * All console routes require authentication.
 */

import { ConsoleLayout } from '@/components/console/ConsoleLayout';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

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

    // If Supabase is not configured or auth fails, redirect to signup
    if (error || !user) {
      redirect('/signup?error=auth_required');
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
    
    // In production, show a clean error page instead of crashing
    if (process.env.NODE_ENV === 'production') {
      return (
        <>
          <Navigation />
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Unable to verify authentication. Please try signing in again.
              </p>
              <Button asChild>
                <Link href="/signup">Sign In</Link>
              </Button>
            </div>
          </div>
          <Footer />
        </>
      );
    }
    
    // In development, redirect to signup with error parameter
    redirect('/signup?error=auth_required');
  }
}
