/**
 * FX Rate Sync Job
 * Automatically syncs FX rates from external provider daily
 */
/**
 * Sync FX rates for all active tenants
 */
export declare function syncFXRatesJob(): Promise<void>;
/**
 * Setup FX rate sync job (call from scheduler)
 * Runs daily at 1 AM UTC
 */
export declare function setupFXRateSyncJob(): void;
//# sourceMappingURL=fx-rate-sync.d.ts.map