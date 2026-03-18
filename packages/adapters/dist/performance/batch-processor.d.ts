/**
 * Performance Optimizations for Large Syncs
 *
 * Batch processing, parallelization, and optimization utilities
 */
export interface BatchConfig {
    batchSize: number;
    maxConcurrency: number;
    retryOnFailure: boolean;
    continueOnError: boolean;
}
/**
 * Process items in batches with concurrency control
 */
export declare function processInBatches<T, R>(items: T[], processor: (batch: T[]) => Promise<R[]>, config?: Partial<BatchConfig>): Promise<{
    results: R[];
    errors: Array<{
        item: T;
        error: Error;
    }>;
}>;
/**
 * Parallel processing with concurrency limit
 */
export declare function processParallel<T, R>(items: T[], processor: (item: T) => Promise<R>, maxConcurrency?: number): Promise<{
    results: R[];
    errors: Array<{
        item: T;
        error: Error;
    }>;
}>;
/**
 * Chunk array into smaller arrays
 */
export declare function chunk<T>(array: T[], size: number): T[][];
/**
 * Deduplicate array by key function
 */
export declare function deduplicate<T>(array: T[], keyFn: (item: T) => string): T[];
/**
 * Optimize database inserts with batching
 */
export declare function batchInsert<T>(items: T[], inserter: (batch: T[]) => Promise<void>, batchSize?: number): Promise<void>;
/**
 * Stream processing for large datasets
 */
export declare function streamProcess<T, R>(items: AsyncIterable<T> | Iterable<T>, processor: (item: T) => Promise<R>, bufferSize?: number): AsyncGenerator<R>;
/**
 * Memory-efficient processing for very large datasets
 */
export declare function processLargeDataset<T, R>(items: AsyncIterable<T>, processor: (batch: T[]) => Promise<R[]>, batchSize?: number, maxMemoryMB?: number): Promise<{
    results: R[];
    processed: number;
}>;
//# sourceMappingURL=batch-processor.d.ts.map