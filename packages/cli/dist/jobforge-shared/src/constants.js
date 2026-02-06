"use strict";
/**
 * JobForge constants
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BACKOFF_MULTIPLIER = exports.MAX_BACKOFF_MS = exports.MIN_BACKOFF_MS = exports.DEFAULT_POLL_INTERVAL_MS = exports.DEFAULT_HEARTBEAT_INTERVAL_MS = exports.DEFAULT_CLAIM_LIMIT = exports.DEFAULT_MAX_ATTEMPTS = void 0;
exports.calculateBackoff = calculateBackoff;
exports.DEFAULT_MAX_ATTEMPTS = 5;
exports.DEFAULT_CLAIM_LIMIT = 10;
exports.DEFAULT_HEARTBEAT_INTERVAL_MS = 30_000; // 30 seconds
exports.DEFAULT_POLL_INTERVAL_MS = 2_000; // 2 seconds
exports.MIN_BACKOFF_MS = 1_000; // 1 second
exports.MAX_BACKOFF_MS = 3_600_000; // 1 hour
exports.BACKOFF_MULTIPLIER = 2; // Exponential backoff
/**
 * Calculate exponential backoff delay in milliseconds
 */
function calculateBackoff(attempt) {
    const delay = exports.MIN_BACKOFF_MS * Math.pow(exports.BACKOFF_MULTIPLIER, attempt - 1);
    return Math.min(delay, exports.MAX_BACKOFF_MS);
}
//# sourceMappingURL=constants.js.map