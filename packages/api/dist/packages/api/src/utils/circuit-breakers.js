"use strict";
/**
 * Circuit Breaker Utilities
 * Prevents cascading failures from external service calls
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCircuitBreaker = createCircuitBreaker;
exports.createAdapterCircuitBreaker = createAdapterCircuitBreaker;
exports.createWebhookCircuitBreaker = createWebhookCircuitBreaker;
exports.createFXRateCircuitBreaker = createFXRateCircuitBreaker;
const opossum_1 = require("opossum");
const logger_1 = require("./logger");
/**
 * Create a circuit breaker for external calls
 */
function createCircuitBreaker(fn, options = {}) {
    const { timeout = 10000, errorThresholdPercentage = 50, resetTimeout = 30000, name = "circuit-breaker", } = options;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const breaker = new opossum_1.CircuitBreaker(fn, {
        timeout,
        errorThresholdPercentage,
        resetTimeout,
        name,
    });
    breaker.on("open", () => {
        (0, logger_1.logWarn)("Circuit breaker opened", {
            name,
            timeout,
            errorThresholdPercentage,
        });
    });
    breaker.on("halfOpen", () => {
        (0, logger_1.logWarn)("Circuit breaker half-open", { name });
    });
    breaker.on("close", () => {
        (0, logger_1.logWarn)("Circuit breaker closed", { name });
    });
    breaker.on("failure", (error) => {
        (0, logger_1.logError)("Circuit breaker failure", error instanceof Error ? error : new Error(String(error)), { name });
    });
    return breaker;
}
/**
 * Circuit breaker for adapter API calls
 */
function createAdapterCircuitBreaker(adapterName, fn) {
    return createCircuitBreaker(fn, {
        name: `adapter-${adapterName}`,
        timeout: 30000, // 30s timeout for adapters
        errorThresholdPercentage: 50,
        resetTimeout: 60000, // 1 minute reset
    });
}
/**
 * Circuit breaker for webhook deliveries
 */
function createWebhookCircuitBreaker(fn) {
    return createCircuitBreaker(fn, {
        name: "webhook-delivery",
        timeout: 10000, // 10s timeout for webhooks
        errorThresholdPercentage: 50,
        resetTimeout: 30000, // 30s reset
    });
}
/**
 * Circuit breaker for FX rate provider calls
 */
function createFXRateCircuitBreaker(fn) {
    return createCircuitBreaker(fn, {
        name: "fx-rate-provider",
        timeout: 5000, // 5s timeout for FX rates
        errorThresholdPercentage: 50,
        resetTimeout: 60000, // 1 minute reset
    });
}
//# sourceMappingURL=circuit-breakers.js.map