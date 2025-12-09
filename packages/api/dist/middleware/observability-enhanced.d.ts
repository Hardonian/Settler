/**
 * Enhanced Observability Middleware
 * Tracks cache hits/misses and additional metrics
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Track cache hit/miss
 */
export declare function trackCacheHit(endpoint: string): void;
export declare function trackCacheMiss(endpoint: string): void;
/**
 * Track reconciliation metrics
 */
export declare function trackReconciliationStart(jobId: string, adapter: string): void;
export declare function trackReconciliationEnd(jobId: string, status: 'completed' | 'failed', durationSeconds: number): void;
/**
 * Enhanced observability middleware
 * Tracks additional metrics beyond basic request/response
 */
export declare function observabilityEnhancedMiddleware(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=observability-enhanced.d.ts.map