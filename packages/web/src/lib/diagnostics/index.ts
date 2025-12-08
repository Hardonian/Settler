/**
 * Runtime Diagnostics
 * 
 * Captures runtime issues, performance problems, and system health.
 */

import { logger } from '../logging/logger';
import { analytics } from '../analytics';

interface DiagnosticEvent {
  type: 'fetch_failure' | 'component_error' | 'hydration_error' | 'layout_shift' | 'slow_response';
  data: Record<string, any>;
  timestamp: string;
}

class Diagnostics {
  private events: DiagnosticEvent[] = [];
  private maxEvents = 100;

  /**
   * Track a failed fetch request
   */
  trackFetchFailure(url: string, error: Error, metadata?: Record<string, any>) {
    const event: DiagnosticEvent = {
      type: 'fetch_failure',
      data: {
        url,
        error: {
          message: error.message,
          stack: error.stack,
        },
        ...metadata,
      },
      timestamp: new Date().toISOString(),
    };

    this.addEvent(event);
    logger.error(`Fetch failed: ${url}`, error, metadata);
    analytics.trackError(error, { type: 'fetch_failure', url, ...metadata });
  }

  /**
   * Track a component load error
   */
  trackComponentError(componentName: string, error: Error, metadata?: Record<string, any>) {
    const event: DiagnosticEvent = {
      type: 'component_error',
      data: {
        component: componentName,
        error: {
          message: error.message,
          stack: error.stack,
        },
        ...metadata,
      },
      timestamp: new Date().toISOString(),
    };

    this.addEvent(event);
    logger.error(`Component error: ${componentName}`, error, metadata);
    analytics.trackError(error, { type: 'component_error', component: componentName, ...metadata });
  }

  /**
   * Track a hydration error
   */
  trackHydrationError(error: Error, metadata?: Record<string, any>) {
    const event: DiagnosticEvent = {
      type: 'hydration_error',
      data: {
        error: {
          message: error.message,
          stack: error.stack,
        },
        ...metadata,
      },
      timestamp: new Date().toISOString(),
    };

    this.addEvent(event);
    logger.error('Hydration error', error, metadata);
    analytics.trackError(error, { type: 'hydration_error', ...metadata });
  }

  /**
   * Track layout shift
   */
  trackLayoutShift(shift: number, element?: string) {
    if (shift < 0.1) return; // Ignore minor shifts

    const event: DiagnosticEvent = {
      type: 'layout_shift',
      data: {
        shift,
        element,
      },
      timestamp: new Date().toISOString(),
    };

    this.addEvent(event);
    logger.warn(`Layout shift detected: ${shift}`, { element });
    analytics.trackEvent('layout_shift', { shift, element });
  }

  /**
   * Track slow API response
   */
  trackSlowResponse(url: string, duration: number, threshold: number = 1000) {
    if (duration < threshold) return;

    const event: DiagnosticEvent = {
      type: 'slow_response',
      data: {
        url,
        duration,
        threshold,
      },
      timestamp: new Date().toISOString(),
    };

    this.addEvent(event);
    logger.warn(`Slow response: ${url} (${duration}ms)`, { duration, threshold });
    analytics.trackEvent('slow_response', { url, duration, threshold });
  }

  /**
   * Get recent diagnostic events
   */
  getEvents(type?: DiagnosticEvent['type']): DiagnosticEvent[] {
    if (type) {
      return this.events.filter((e) => e.type === type);
    }
    return [...this.events];
  }

  /**
   * Clear events
   */
  clear() {
    this.events = [];
  }

  private addEvent(event: DiagnosticEvent) {
    this.events.push(event);
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }
  }
}

export const diagnostics = new Diagnostics();

// Initialize layout shift observer
if (typeof window !== 'undefined') {
  try {
    let clsValue = 0;
    let clsEntries: PerformanceEntry[] = [];

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Only count if the entry doesn't have recent user input
        if (!(entry as any).hadRecentInput) {
          const firstSessionEntry = clsEntries[0];
          const lastSessionEntry = clsEntries[clsEntries.length - 1];

          // If the entry is the first one, or if it's been more than 1 second since the last entry
          if (
            !firstSessionEntry ||
            entry.startTime - lastSessionEntry.startTime > 1000
          ) {
            clsEntries = [entry];
          } else {
            clsEntries.push(entry);
          }

          // Calculate CLS
          let sessionValue = 0;
          for (const e of clsEntries) {
            sessionValue += (e as any).value;
          }

          if (sessionValue > clsValue) {
            clsValue = sessionValue;
            diagnostics.trackLayoutShift(clsValue);
          }
        }
      }
    });

    observer.observe({ type: 'layout-shift', buffered: true });
  } catch (error) {
    // PerformanceObserver not supported
  }
}
