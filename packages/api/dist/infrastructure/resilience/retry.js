"use strict";
/**
 * Retry Logic with Exponential Backoff
 * Implements retry logic with jitter for external API calls
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryWithBackoff = retryWithBackoff;
exports.addJitter = addJitter;
const p_retry_1 = __importStar(require("p-retry"));
const logger_1 = require("../../utils/logger");
const DEFAULT_OPTIONS = {
    retries: 3,
    minTimeout: 1000,
    maxTimeout: 10000,
    factor: 2,
    onFailedAttempt: () => { },
};
/**
 * Retry a function with exponential backoff
 */
async function retryWithBackoff(fn, options = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    return (0, p_retry_1.default)(async () => {
        try {
            return await fn();
        }
        catch (error) {
            // Don't retry on certain errors
            if (error instanceof p_retry_1.AbortError) {
                throw error;
            }
            const err = error instanceof Error ? error : new Error(String(error));
            // Check if error is retryable
            if (!isRetryableError(err)) {
                throw new p_retry_1.AbortError(err);
            }
            throw err;
        }
    }, {
        retries: opts.retries,
        minTimeout: opts.minTimeout,
        maxTimeout: opts.maxTimeout,
        factor: opts.factor,
        onFailedAttempt: (error) => {
            (0, logger_1.logWarn)('Retry attempt failed', {
                attempt: error.attemptNumber,
                retriesLeft: error.retriesLeft,
                error: error.message,
            });
            opts.onFailedAttempt?.(error);
        },
    });
}
/**
 * Check if an error is retryable
 */
function isRetryableError(error) {
    const retryableMessages = [
        'timeout',
        'ECONNRESET',
        'ETIMEDOUT',
        'ENOTFOUND',
        'ECONNREFUSED',
        'EAI_AGAIN',
    ];
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();
    // Network errors are retryable
    if (retryableMessages.some((msg) => message.includes(msg) || name.includes(msg))) {
        return true;
    }
    // HTTP status codes that are retryable
    const statusCode = error.statusCode || error.status;
    if (statusCode) {
        // 429 (Too Many Requests), 503 (Service Unavailable), 502 (Bad Gateway), 504 (Gateway Timeout)
        return [429, 502, 503, 504].includes(statusCode);
    }
    return false;
}
/**
 * Add jitter to delay to prevent thundering herd
 */
function addJitter(delay, jitterPercent = 0.1) {
    const jitter = delay * jitterPercent * Math.random();
    return delay + jitter - delay * jitterPercent * 0.5;
}
//# sourceMappingURL=retry.js.map