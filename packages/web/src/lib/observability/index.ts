/**
 * Observability Entry Point
 *
 * Central export for all observability tools.
 */

// Analytics
export { analytics } from "../analytics";
export type {
  AnalyticsProvider,
  PageViewProperties,
  EventProperties,
  ErrorMetadata,
} from "../analytics";

// Logging
export { logger } from "../logging/logger";
export type { LogLevel, LogEntry, Logger } from "../logging/types";

// Diagnostics
export { diagnostics } from "../diagnostics";

// Performance
export { reportWebVitals, initWebVitals } from "../performance/web-vitals";
export { routeMetrics } from "../performance/route-metrics";

// Telemetry
export { telemetry } from "../telemetry/events";
export {
  useTrackButton,
  useTrackCTA,
  useTrackForm,
  useTrackFunnel,
  useTrackConversion,
  useTrackLink,
} from "../telemetry/hooks";

// Monitoring
export { sentry } from "../monitoring/sentry";

// Session Replay
export { sessionReplay } from "../session/session-replay";

// API Client
export { defensiveFetch, fetchJSON, fetchWithFallback } from "../api/client";
export type { FetchOptions } from "../api/client";

// Resilience
export {
  LoadingFallback,
  ErrorFallback,
  EmptyFallback,
  PartialDataFallback,
  TimeoutFallback,
  NetworkErrorFallback,
  withErrorBoundary,
} from "../resilience/fallbacks";
export type { FallbackProps } from "../resilience/fallbacks";
