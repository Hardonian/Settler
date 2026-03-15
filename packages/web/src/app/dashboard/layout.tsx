/**
 * Dashboard Layout
 *
 * Wraps all dashboard pages with error boundaries and consistent layout.
 */

import { ErrorBoundary } from "@/components/shared/error-boundary";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import type { Metadata } from "next";
import { OperationalRouteNotice } from "@/components/shared/OperationalRouteNotice";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary context="Dashboard Layout">
      <Navigation />
      <main id="main-content" className="min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <OperationalRouteNotice />
        </div>
        {children}
      </main>
      <Footer />
    </ErrorBoundary>
  );
}
