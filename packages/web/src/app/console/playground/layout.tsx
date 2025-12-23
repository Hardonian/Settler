/**
 * Console Playground Layout
 * 
 * CRITICAL: This is the CONSOLE playground, nested under /console.
 * It inherits authentication and subscription requirements from the parent console layout.
 * 
 * For public playground (no auth), see /playground route.
 * 
 * This playground provides authenticated users with:
 * - Real API testing with their credentials
 * - Tenant-scoped data
 * - Subscription-aware features
 */

import { ConsoleLayout } from '@/components/console/ConsoleLayout';
import { Footer } from '@/components/Footer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function ConsolePlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout inherits auth + subscription from parent /console layout
  // No additional auth checks needed here - parent console layout enforces it
  return (
    <>
      <ConsoleLayout>{children}</ConsoleLayout>
      <Footer />
    </>
  );
}
