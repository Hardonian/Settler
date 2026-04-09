"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setTelemetryProvider = setTelemetryProvider;
exports.setTelemetryConfig = setTelemetryConfig;
exports.useTelemetry = useTelemetry;
/**
 * useTelemetry Hook
 * Enterprise-grade telemetry and observability
 *
 * ⚠️ Commercial Feature: Requires Settler Commercial subscription
 */
const licensing_1 = require("../utils/licensing");
const react_1 = require("react");
let globalTelemetryProvider = null;
let globalConfig = {
    enabled: false,
    sampleRate: 1.0,
    batchSize: 10,
    flushInterval: 5000,
    trackPerformance: true,
    trackErrors: true,
    trackUsers: false,
    scrubPII: true,
};
/**
 * Set global telemetry provider
 */
function setTelemetryProvider(provider) {
    globalTelemetryProvider = provider;
}
/**
 * Set global telemetry config
 */
function setTelemetryConfig(config) {
    globalConfig = { ...globalConfig, ...config };
}
/**
 * useTelemetry Hook
 */
function useTelemetry(componentName) {
    // Check feature access (warn in dev, allow in OSS for basic usage)
    if (process.env.NODE_ENV === "production") {
        (0, licensing_1.requireFeature)(licensing_1.FEATURE_FLAGS.TELEMETRY, "Telemetry");
    }
    const renderStartTime = (0, react_1.useRef)(Date.now());
    const interactionStartTime = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        if (!globalConfig.enabled || !globalConfig.trackPerformance) {
            return;
        }
        renderStartTime.current = Date.now();
        return () => {
            const renderTime = Date.now() - renderStartTime.current;
            if (componentName && renderTime > 0) {
                trackPerformance({
                    renderTime,
                }, componentName);
            }
        };
    }, [componentName]);
    const track = (0, react_1.useCallback)((eventName, properties) => {
        if (!globalConfig.enabled || !globalTelemetryProvider) {
            return;
        }
        // Apply sampling
        if (Math.random() > (globalConfig.sampleRate || 1.0)) {
            return;
        }
        const event = {
            id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            type: "component.interaction",
            name: eventName,
            ...(properties
                ? { properties: globalConfig.scrubPII ? scrubPII(properties) : properties }
                : {}),
            ...(componentName ? { context: { component: componentName } } : {}),
        };
        globalTelemetryProvider.track(event);
    }, [componentName]);
    const trackError = (0, react_1.useCallback)((error, context) => {
        if (!globalConfig.enabled || !globalConfig.trackErrors || !globalTelemetryProvider) {
            return;
        }
        const errorTelemetry = {
            error,
            ...(componentName ? { component: componentName } : {}),
            ...(context
                ? { context: globalConfig.scrubPII ? scrubPII(context) : context }
                : {}),
            timestamp: new Date().toISOString(),
        };
        globalTelemetryProvider.trackError(errorTelemetry);
    }, [componentName]);
    const trackPerformance = (0, react_1.useCallback)((metrics, component) => {
        if (!globalConfig.enabled || !globalConfig.trackPerformance || !globalTelemetryProvider) {
            return;
        }
        const event = {
            id: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            type: "performance",
            name: "component.performance",
            measurements: metrics,
            ...(component || componentName
                ? { context: { component: component || componentName } }
                : {}),
        };
        globalTelemetryProvider.track(event);
    }, [componentName]);
    const startInteraction = (0, react_1.useCallback)(() => {
        interactionStartTime.current = Date.now();
    }, []);
    const endInteraction = (0, react_1.useCallback)((action) => {
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
        endInteraction,
    };
}
/**
 * Scrub PII from properties
 */
function scrubPII(properties) {
    if (!properties) {
        return undefined;
    }
    const scrubbed = {};
    const piiPatterns = [
        /email/i,
        /phone/i,
        /ssn/i,
        /credit.?card/i,
        /card.?number/i,
        /cvv/i,
        /password/i,
        /token/i,
        /api.?key/i,
    ];
    for (const [key, value] of Object.entries(properties)) {
        const isPII = piiPatterns.some((pattern) => pattern.test(key));
        if (isPII && typeof value === "string") {
            scrubbed[key] = "[REDACTED]";
        }
        else {
            scrubbed[key] = value;
        }
    }
    return scrubbed;
}
//# sourceMappingURL=useTelemetry.js.map