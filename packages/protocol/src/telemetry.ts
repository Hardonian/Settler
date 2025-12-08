/**
 * Telemetry and Observability Types
 * Enterprise-grade monitoring and analytics
 */

/**
 * Telemetry Event
 */
export interface TelemetryEvent {
  id: string;
  timestamp: string; // ISO 8601
  type: TelemetryEventType;
  name: string;
  properties?: Record<string, unknown>;
  measurements?: Record<string, number>;
  userId?: string;
  sessionId?: string;
  context?: TelemetryContext;
}

export type TelemetryEventType =
  | 'pageview'
  | 'component.render'
  | 'component.interaction'
  | 'api.call'
  | 'error'
  | 'performance'
  | 'custom';

export interface TelemetryContext {
  page?: string;
  component?: string;
  action?: string;
  environment?: string;
  version?: string;
}

/**
 * Performance Metrics
 */
export interface PerformanceMetrics {
  renderTime?: number; // ms
  compileTime?: number; // ms
  dataLoadTime?: number; // ms
  interactionLatency?: number; // ms
  memoryUsage?: number; // bytes
}

/**
 * Error Telemetry
 */
export interface ErrorTelemetry {
  error: Error;
  component?: string;
  context?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  timestamp: string;
}

/**
 * Telemetry Configuration
 */
export interface TelemetryConfig {
  /** Enable telemetry */
  enabled: boolean;
  /** Telemetry endpoint */
  endpoint?: string;
  /** Sample rate (0-1) */
  sampleRate?: number;
  /** Batch size */
  batchSize?: number;
  /** Flush interval (ms) */
  flushInterval?: number;
  /** Enable performance tracking */
  trackPerformance?: boolean;
  /** Enable error tracking */
  trackErrors?: boolean;
  /** Enable user tracking */
  trackUsers?: boolean;
  /** PII scrubbing */
  scrubPII?: boolean;
}

/**
 * Telemetry Provider Interface
 */
export interface TelemetryProvider {
  track(event: TelemetryEvent): void;
  trackError(error: ErrorTelemetry): void;
  trackPerformance(metrics: PerformanceMetrics): void;
  flush(): Promise<void>;
  setUser(userId: string, properties?: Record<string, unknown>): void;
  setContext(context: TelemetryContext): void;
}
