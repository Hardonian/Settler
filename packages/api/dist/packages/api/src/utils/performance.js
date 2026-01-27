"use strict";
/**
 * Performance Utilities
 * Provides performance monitoring and optimization helpers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.measureAsync = measureAsync;
exports.measureSync = measureSync;
exports.batchProcess = batchProcess;
exports.debounce = debounce;
exports.throttle = throttle;
exports.memoize = memoize;
const logger_1 = require("./logger");
/**
 * Measure execution time of async function
 */
async function measureAsync(fn, label) {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    if (label && duration > 100) {
        (0, logger_1.logWarn)(`Performance: ${label} took ${duration.toFixed(2)}ms`, {
            label,
            duration,
            threshold: 100,
        });
    }
    return { result, duration };
}
/**
 * Measure execution time of sync function
 */
function measureSync(fn, label) {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    if (label && duration > 100) {
        (0, logger_1.logWarn)(`Performance: ${label} took ${duration.toFixed(2)}ms`, {
            label,
            duration,
            threshold: 100,
        });
    }
    return { result, duration };
}
/**
 * Batch operations for better performance
 */
async function batchProcess(items, batchSize, processor) {
    const results = [];
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await processor(batch);
        results.push(...batchResults);
    }
    return results;
}
/**
 * Debounce function calls
 */
function debounce(fn, delay) {
    let timeoutId = null;
    return (...args) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            fn(...args);
        }, delay);
    };
}
/**
 * Throttle function calls
 */
function throttle(fn, delay) {
    let lastCall = 0;
    return (...args) => {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            fn(...args);
        }
    };
}
/**
 * Memoize function results
 */
function memoize(fn, keyGenerator) {
    const cache = new Map();
    return (...args) => {
        const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
        if (cache.has(key)) {
            return cache.get(key);
        }
        const result = fn(...args);
        cache.set(key, result);
        return result;
    };
}
//# sourceMappingURL=performance.js.map