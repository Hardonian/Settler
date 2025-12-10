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
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

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
    // Log error for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.error('Console auth error:', error);
    }
    // Redirect to signup with error parameter
    redirect('/signup?error=auth_required');
  }
}
