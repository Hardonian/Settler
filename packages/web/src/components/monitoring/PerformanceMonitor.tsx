'use client';

import { useEffect } from 'react';
import { reportWebVitals } from '@/lib/analytics/web-vitals';

/**
 * Performance Monitor Component
 * 
 * Tracks Core Web Vitals and performance metrics.
 * Integrates with Vercel Analytics and custom analytics.
 */
export function PerformanceMonitor() {
  useEffect(() => {
    // Report Web Vitals to analytics
    if (typeof window !== 'undefined') {
      reportWebVitals((metric) => {
        // Send to Vercel Analytics (already handled by @vercel/analytics)
        // Also send to custom analytics if needed
        if (process.env.NODE_ENV === 'development') {
          console.log('[Performance]', metric);
        }
      });
    }
  }, []);

  return null; // This component doesn't render anything
}
