/**
 * Ops Intelligence Hooks
 *
 * Custom hooks for Ops Intelligence functionality
 */

import { useEffect, useRef } from "react";

/**
 * Performance monitoring hook
 */
export function usePerformanceMonitor(componentName: string) {
  const renderStart = useRef<number>(Date.now());

  useEffect(() => {
    const renderTime = Date.now() - renderStart.current;
    if (renderTime > 100) {
      // Log slow renders
      console.warn(`[Performance] ${componentName} took ${renderTime}ms to render`);
    }
  });
}

/**
 * Error tracking hook
 */
export function useErrorTracking(componentName: string) {
  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      console.error(`[Error] ${componentName}:`, {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      });
    };

    window.addEventListener("error", errorHandler);
    return () => window.removeEventListener("error", errorHandler);
  }, [componentName]);
}
