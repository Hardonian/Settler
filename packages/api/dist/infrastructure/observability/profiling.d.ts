/**
 * Performance Profiling Utilities
 * Provides request duration tracking, database query profiling, and memory monitoring
 */
import { Request, Response, NextFunction } from 'express';
export interface ProfileMetrics {
    requestDuration: number;
    databaseQueries?: number;
    databaseDuration?: number;
    memoryUsage?: NodeJS.MemoryUsage;
    timestamp: string;
}
/**
 * Middleware to profile request performance
 */
export declare function profilingMiddleware(req: Request, res: Response, next: NextFunction): void;
/**
 * Profile database query execution
 */
export declare function profileQuery<T>(queryFn: () => Promise<T>, queryName?: string): Promise<{
    result: T;
    duration: number;
}>;
/**
 * Get current memory usage
 */
export declare function getMemoryUsage(): NodeJS.MemoryUsage;
/**
 * Format memory usage for logging
 */
export declare function formatMemoryUsage(usage: NodeJS.MemoryUsage): string;
/**
 * Memory usage monitoring endpoint data
 */
export declare function getMemoryMetrics(): {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    formatted: string;
};
//# sourceMappingURL=profiling.d.ts.map