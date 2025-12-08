/**
 * Root Template (Next.js App Router)
 *
 * Wraps all pages for consistent instrumentation and tracking.
 */

"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { analytics } from "@/lib/analytics";
import { routeMetrics } from "@/lib/performance/route-metrics";
import { telemetry } from "@/lib/telemetry/events";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Handle null pathname (shouldn't happen in practice, but TypeScript types it as nullable)
    const route = pathname ?? "/";

    // Track page view
    analytics.trackPageView(route, {
      title: document.title,
      referrer: document.referrer,
    });

    // Track route transition
    routeMetrics.startTransition(route);
    routeMetrics.startHydration(route);

    // Reset scroll depth tracking for new page
    telemetry.resetScrollDepth();

    // Mark hydration complete after a short delay
    const hydrationTimer = setTimeout(() => {
      routeMetrics.endHydration(route);
      routeMetrics.endTransition(route);
    }, 100);

    return () => {
      clearTimeout(hydrationTimer);
    };
  }, [pathname]);

  return <>{children}</>;
}
