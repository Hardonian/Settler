/**
 * useTelemetry Hook
 * Enterprise-grade telemetry and observability
 * 
 * ⚠️ Commercial Feature: Requires Settler Commercial subscription
 */
import { requireFeature, FEATURE_FLAGS } from '../utils/licensing';

import { useCallback, useEffect, useRef } from 'react';
import {
  TelemetryEvent,
  TelemetryProvider,
  TelemetryConfig,
  TelemetryContext,
  PerformanceMetrics,
  ErrorTelemetry
} from '@settler/protocol';

let globalTelemetryProvider: TelemetryProvider | null = null;
let globalConfig: TelemetryConfig = {
  enabled: false,
  sampleRate: 1.0,
  batchSize: 10,
  flushInterval: 5000,
  trackPerformance: true,
  trackErrors: true,
  trackUsers: false,
  scrubPII: true
};

/**
 * Set global telemetry provider
 */
export function setTelemetryProvider(provider: TelemetryProvider): void {
  globalTelemetryProvider = provider;
}

/**
 * Set global telemetry config
 */
export function setTelemetryConfig(config: Partial<TelemetryConfig>): void {
  globalConfig = { ...globalConfig, ...config };
}

/**
 * useTelemetry Hook
 */
export function useTelemetry(componentName?: string) {
  // Check feature access (warn in dev, allow in OSS for basic usage)
  if (process.env.NODE_ENV === 'production') {
    requireFeature(FEATURE_FLAGS.TELEMETRY, 'Telemetry');
  }
  
  const renderStartTime = useRef<number>(Date.now());
  const interactionStartTime = useRef<number | null>(null);

  useEffect(() => {
    if (!globalConfig.enabled || !globalConfig.trackPerformance) {
      return;
    }

    renderStartTime.current = Date.now();

    return () => {
      const renderTime = Date.now() - renderStartTime.current;
      if (componentName && renderTime > 0) {
        trackPerformance({
          renderTime
        }, componentName);
      }
    };
  }, [componentName]);

  const track = useCallback((eventName: string, properties?: Record<string, unknown>) => {
    if (!globalConfig.enabled || !globalTelemetryProvider) {
      return;
    }

    // Apply sampling
    if (Math.random() > (globalConfig.sampleRate || 1.0)) {
      return;
    }

    const event: TelemetryEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type: 'component.interaction',
      name: eventName,
      ...(properties ? { properties: globalConfig.scrubPII ? scrubPII(properties) : properties } as { properties: Record<string, unknown> } : {}),
      ...(componentName ? { context: { component: componentName } as TelemetryContext } : {})
    };

    globalTelemetryProvider.track(event);
  }, [componentName]);

  const trackError = useCallback((error: Error, context?: Record<string, unknown>) => {
    if (!globalConfig.enabled || !globalConfig.trackErrors || !globalTelemetryProvider) {
      return;
    }

    const errorTelemetry: ErrorTelemetry = {
      error,
      ...(componentName ? { component: componentName } as { component: string } : {}),
      ...(context ? { context: globalConfig.scrubPII ? scrubPII(context) : context } as { context: Record<string, unknown> } : {}),
      timestamp: new Date().toISOString()
    };

    globalTelemetryProvider.trackError(errorTelemetry);
  }, [componentName]);

  const trackPerformance = useCallback((metrics: PerformanceMetrics, component?: string) => {
    if (!globalConfig.enabled || !globalConfig.trackPerformance || !globalTelemetryProvider) {
      return;
    }

    const event: TelemetryEvent = {
      id: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type: 'performance',
      name: 'component.performance',
      measurements: metrics as Record<string, number>,
      ...((component || componentName) ? { context: { component: component || componentName } as TelemetryContext } : {})
    };

    globalTelemetryProvider.track(event);
  }, [componentName]);

  const startInteraction = useCallback(() => {
    interactionStartTime.current = Date.now();
  }, []);

  const endInteraction = useCallback((action: string) => {
    if (interactionStartTime.current === null) {
      return;
    }

    const latency = Date.now() - interactionStartTime.current;
    trackPerformance({ interactionLatency: latency }, componentName);
    track(action, { latency });
    interactionStartTime.current = null;
  }, [componentName, track, trackPerformance]);

  return {
    track,
    trackError,
    trackPerformance,
    startInteraction,
    endInteraction
  };
}

/**
 * Scrub PII from properties
 */
function scrubPII(properties?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!properties) {
    return undefined;
  }

  const scrubbed: Record<string, unknown> = {};
  const piiPatterns = [
    /email/i,
    /phone/i,
    /ssn/i,
    /credit.?card/i,
    /card.?number/i,
    /cvv/i,
    /password/i,
    /token/i,
    /api.?key/i
  ];

  for (const [key, value] of Object.entries(properties)) {
    const isPII = piiPatterns.some(pattern => pattern.test(key));
    if (isPII && typeof value === 'string') {
      scrubbed[key] = '[REDACTED]';
    } else {
      scrubbed[key] = value;
    }
  }

  return scrubbed;
}
