/**
 * Dashboard Layout
 * 
 * Wraps all dashboard pages with error boundaries and consistent layout.
 */

import { ErrorBoundary } from '@/components/shared/error-boundary';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary context="Dashboard Layout">
      <Navigation />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </ErrorBoundary>
  );
}
