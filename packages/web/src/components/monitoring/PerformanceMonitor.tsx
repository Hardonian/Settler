'use client';

import { useEffect } from 'react';

/**
 * Performance Monitor Component
 * 
 * Tracks Core Web Vitals and performance metrics.
 * Vercel Analytics already handles Web Vitals reporting automatically.
 * This component is a placeholder for any custom performance tracking.
 */
export function PerformanceMonitor() {
  useEffect(() => {
    // Vercel Analytics automatically tracks Web Vitals
    // This component can be extended for custom performance tracking if needed
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      // Optional: Log performance metrics in development
      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.entryType === 'navigation' || entry.entryType === 'paint') {
                console.log('[Performance]', entry.name, entry.duration);
              }
            }
          });
          observer.observe({ entryTypes: ['navigation', 'paint'] });
          return () => {
            observer.disconnect();
          };
        } catch (error: unknown) {
          // PerformanceObserver not supported or error
          return undefined;
        }
      }
    }
    return undefined;
  }, []);

  return null; // This component doesn't render anything
}
