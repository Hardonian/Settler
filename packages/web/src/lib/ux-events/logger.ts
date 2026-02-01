/**
 * UX Event Logger
 *
 * Logs UX events locally in dev, stubs for backend in production.
 * No PII, no secrets.
 */

import type { UXEventType, ErrorOccurredEvent } from "./types";

/**
 * Maximum events to store locally
 */
const MAX_LOCAL_EVENTS = 100;

/**
 * Local event storage (in-memory, cleared on refresh)
 */
let localEvents: UXEventType[] = [];

// Metadata function kept for future use when backend analytics is implemented
// function getMetadata(): UXEventMetadata {
//   if (typeof window === 'undefined') {
//     return {};
//   }
//
//   const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
//
//   let screenSize: 'mobile' | 'tablet' | 'desktop' = 'desktop';
//   if (window.innerWidth < 768) {
//     screenSize = 'mobile';
//   } else if (window.innerWidth < 1024) {
//     screenSize = 'tablet';
//   }
//
//   return {
//     reducedMotion,
//     screenSize,
//     userAgent: navigator.userAgent.split(' ').slice(0, 3).join(' '), // Sanitized
//   };
// }

/**
 * Generate unique event ID
 */
function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get current route
 */
function getCurrentRoute(): string {
  if (typeof window === "undefined") {
    return "unknown";
  }
  return window.location.pathname;
}

/**
 * Log a UX event
 */
export function logUXEvent(
  event:
    | Omit<UXEventType, "id" | "timestamp" | "route">
    | (Partial<UXEventType> & { type: UXEventType["type"] })
): void {
  const fullEvent: UXEventType = {
    ...event,
    id: generateEventId(),
    timestamp: new Date().toISOString(),
    route: getCurrentRoute(),
  } as UXEventType;

  // Store locally (dev only, or for dev view)
  if (process.env.NODE_ENV === "development" || typeof window !== "undefined") {
    localEvents.push(fullEvent);

    // Keep only recent events
    if (localEvents.length > MAX_LOCAL_EVENTS) {
      localEvents = localEvents.slice(-MAX_LOCAL_EVENTS);
    }

    // Log to console in dev
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.log("[UX Event]", fullEvent);
    }
  }

  // TODO: Send to backend analytics (stub for now)
  // In production, this would send to your analytics service
  // sendToBackend(fullEvent, getMetadata()).catch(console.error);
}

/**
 * Get recent events (for dev view)
 */
export function getRecentEvents(limit: number = 50): UXEventType[] {
  return localEvents.slice(-limit).reverse();
}

/**
 * Clear all events (for dev/testing)
 */
export function clearEvents(): void {
  localEvents = [];
}

/**
 * Get event statistics
 */
export function getEventStats(): {
  total: number;
  byType: Record<string, number>;
  recent: UXEventType[];
} {
  const byType: Record<string, number> = {};

  localEvents.forEach((event) => {
    byType[event.type] = (byType[event.type] || 0) + 1;
  });

  return {
    total: localEvents.length,
    byType,
    recent: localEvents.slice(-10).reverse(),
  };
}

/**
 * Helper: Log step viewed
 */
export function logStepViewed(flowId: string, stepId: string, stepName: string): void {
  logUXEvent({
    type: "step_viewed",
    flowId,
    stepId,
    stepName,
  });
}

/**
 * Helper: Log step completed
 */
export function logStepCompleted(
  flowId: string,
  stepId: string,
  stepName: string,
  duration?: number
): void {
  logUXEvent({
    type: "step_completed",
    flowId,
    stepId,
    stepName,
    duration,
  });
}

/**
 * Helper: Log flow started
 */
export function logFlowStarted(flowId: string, flowName: string): void {
  logUXEvent({
    type: "flow_started",
    flowId,
    flowName,
  });
}

/**
 * Helper: Log flow completed
 */
export function logFlowCompleted(
  flowId: string,
  flowName: string,
  duration: number,
  stepsCompleted: number,
  stepsSkipped?: number
): void {
  logUXEvent({
    type: "flow_completed",
    flowId,
    flowName,
    duration,
    stepsCompleted,
    stepsSkipped,
  });
}

/**
 * Helper: Log error
 */
export function logError(
  errorMessage: string,
  errorType?: string,
  flowId?: string,
  stepId?: string,
  recovered?: boolean
): void {
  const event: Omit<ErrorOccurredEvent, "id" | "timestamp" | "route"> = {
    type: "error_occurred",
    errorMessage,
  };

  if (errorType !== undefined) {
    event.errorType = errorType;
  }
  if (flowId !== undefined) {
    event.flowId = flowId;
  }
  if (stepId !== undefined) {
    event.stepId = stepId;
  }
  if (recovered !== undefined) {
    event.recovered = recovered;
  }

  logUXEvent(event);
}

/**
 * Helper: Log retry
 */
export function logRetry(flowId: string, stepId: string, retryCount: number): void {
  logUXEvent({
    type: "retry_attempted",
    flowId,
    stepId,
    retryCount,
  });
}

/**
 * Helper: Log flow abandoned
 */
export function logFlowAbandoned(
  flowId: string,
  flowName: string,
  lastStepId: string,
  progress: number
): void {
  logUXEvent({
    type: "flow_abandoned",
    flowId,
    flowName,
    lastStepId,
    progress,
  });
}
