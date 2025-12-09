"use strict";
/**
 * Circuit Breaker Implementation
 * Prevents cascading failures by opening circuit after threshold failures
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCircuitBreaker = createCircuitBreaker;
exports.createApiCircuitBreaker = createApiCircuitBreaker;
const opossum_1 = require("opossum");
const logger_1 = require("../../utils/logger");
const DEFAULT_CONFIG = {
    timeout: 30000, // 30 seconds
    errorThresholdPercentage: 50, // Open circuit after 50% failures
    resetTimeout: 60000, // Try again after 60 seconds
    name: 'circuit-breaker',
};
/**
 * Create a circuit breaker for a function
 */
function createCircuitBreaker(fn, config = {}) {
    const opts = { ...DEFAULT_CONFIG, ...config };
    const breakerOptions = {
        timeout: opts.timeout,
        errorThresholdPercentage: opts.errorThresholdPercentage,
        resetTimeout: opts.resetTimeout,
        name: opts.name,
    };
    const breaker = new opossum_1.CircuitBreaker(fn, breakerOptions);
    // Event handlers
    breaker.on('open', () => {
        (0, logger_1.logWarn)('Circuit breaker opened', {
            name: opts.name,
            failures: breaker.stats.failures,
            fires: breaker.stats.fires,
        });
    });
    breaker.on('halfOpen', () => {
        (0, logger_1.logInfo)('Circuit breaker half-open', {
            name: opts.name,
        });
    });
    breaker.on('close', () => {
        (0, logger_1.logInfo)('Circuit breaker closed', {
            name: opts.name,
        });
    });
    breaker.on('reject', (error) => {
        (0, logger_1.logWarn)('Circuit breaker rejected request', {
            name: opts.name,
            error: error.message,
        });
    });
    breaker.on('failure', (error) => {
        (0, logger_1.logError)('Circuit breaker failure', error, {
            name: opts.name,
        });
    });
    return breaker;
}
/**
 * Circuit breaker for external API calls
 */
function createApiCircuitBreaker(fn, apiName) {
    return createCircuitBreaker(fn, {
        name: `api-${apiName}`,
        timeout: 30000,
        errorThresholdPercentage: 50,
        resetTimeout: 60000,
    });
}
//# sourceMappingURL=circuit-breaker.js.map