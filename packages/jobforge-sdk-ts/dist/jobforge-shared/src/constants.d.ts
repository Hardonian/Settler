/**
 * JobForge constants
 */
export declare const DEFAULT_MAX_ATTEMPTS = 5;
export declare const DEFAULT_CLAIM_LIMIT = 10;
export declare const DEFAULT_HEARTBEAT_INTERVAL_MS = 30000;
export declare const DEFAULT_POLL_INTERVAL_MS = 2000;
export declare const MIN_BACKOFF_MS = 1000;
export declare const MAX_BACKOFF_MS = 3600000;
export declare const BACKOFF_MULTIPLIER = 2;
/**
 * Calculate exponential backoff delay in milliseconds
 */
export declare function calculateBackoff(attempt: number): number;
//# sourceMappingURL=constants.d.ts.map