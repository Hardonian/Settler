/**
 * Root Template (Next.js App Router)
 * 
 * Wraps all pages for consistent instrumentation and tracking.
 */

'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { analytics } from '@/lib/analytics';
import { routeMetrics } from '@/lib/performance/route-metrics';
import { telemetry } from '@/lib/telemetry/events';

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Track page view
    analytics.trackPageView(pathname, {
      title: document.title,
      referrer: document.referrer,
    });

    // Track route transition
    routeMetrics.startTransition(pathname);
    routeMetrics.startHydration(pathname);

    // Reset scroll depth tracking for new page
    telemetry.resetScrollDepth();

    // Mark hydration complete after a short delay
    const hydrationTimer = setTimeout(() => {
      routeMetrics.endHydration(pathname);
      routeMetrics.endTransition(pathname);
    }, 100);

    return () => {
      clearTimeout(hydrationTimer);
    };
  }, [pathname]);

  return <>{children}</>;
}
