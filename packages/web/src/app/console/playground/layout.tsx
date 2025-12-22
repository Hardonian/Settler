/**
 * Playground Layout
 * 
 * Provides consistent layout and subscription context for all playground pages.
 * Playground pages are accessible without authentication for basic testing.
 * 
 * NOTE: Navigation is provided by parent console layout to avoid duplication.
 */

import { ConsoleLayout } from '@/components/console/ConsoleLayout';
import { Footer } from '@/components/Footer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Playground pages are accessible without authentication
  // They use ConsoleLayout but don't require auth checks
  // Navigation is provided by parent console layout
  return (
    <>
      <ConsoleLayout>{children}</ConsoleLayout>
      <Footer />
    </>
  );
}
