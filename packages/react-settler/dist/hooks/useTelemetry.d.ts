import { TelemetryProvider, TelemetryConfig, PerformanceMetrics } from "@settler/protocol";
/**
 * Set global telemetry provider
 */
export declare function setTelemetryProvider(provider: TelemetryProvider): void;
/**
 * Set global telemetry config
 */
export declare function setTelemetryConfig(config: Partial<TelemetryConfig>): void;
/**
 * useTelemetry Hook
 */
export declare function useTelemetry(componentName?: string): {
    track: (eventName: string, properties?: Record<string, unknown>) => void;
    trackError: (error: Error, context?: Record<string, unknown>) => void;
    trackPerformance: (metrics: PerformanceMetrics, component?: string) => void;
    startInteraction: () => void;
    endInteraction: (action: string) => void;
};
//# sourceMappingURL=useTelemetry.d.ts.map