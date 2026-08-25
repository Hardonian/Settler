"use strict";
/**
 * Performance Optimizations for Large Syncs
 *
 * Batch processing, parallelization, and optimization utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.processInBatches = processInBatches;
exports.processParallel = processParallel;
exports.chunk = chunk;
exports.deduplicate = deduplicate;
exports.batchInsert = batchInsert;
exports.streamProcess = streamProcess;
exports.processLargeDataset = processLargeDataset;
const DEFAULT_BATCH_CONFIG = {
    batchSize: 100,
    maxConcurrency: 5,
    retryOnFailure: true,
    continueOnError: true,
};
/**
 * Process items in batches with concurrency control
 */
async function processInBatches(items, processor, config = {}) {
    const finalConfig = { ...DEFAULT_BATCH_CONFIG, ...config };
    if (!Number.isFinite(finalConfig.batchSize) || finalConfig.batchSize < 1) {
        throw new Error(`batchSize must be a finite integer >= 1, got ${finalConfig.batchSize}`);
    }
    if (!Number.isFinite(finalConfig.maxConcurrency) || finalConfig.maxConcurrency < 1) {
        throw new Error(`maxConcurrency must be a finite integer >= 1, got ${finalConfig.maxConcurrency}`);
    }
    const results = [];
    const errors = [];
    // Split into batches
    const batches = [];
    for (let i = 0; i < items.length; i += finalConfig.batchSize) {
        batches.push(items.slice(i, i + finalConfig.batchSize));
    }
    // Process batches with concurrency control
    const semaphore = new Semaphore(finalConfig.maxConcurrency);
    await Promise.all(batches.map(async (batch) => {
        await semaphore.acquire();
        try {
            const batchResults = await processor(batch);
            results.push(...batchResults);
        }
        catch (error) {
            if (finalConfig.continueOnError) {
                const firstItem = batch[0];
                if (firstItem !== undefined) {
                    errors.push({
                        item: firstItem, // Represent batch with first item
                        error: error instanceof Error ? error : new Error(String(error)),
                    });
                }
            }
            else {
                throw error;
            }
        }
        finally {
            semaphore.release();
        }
    }));
    return { results, errors };
}
/**
 * Semaphore for concurrency control
 */
class Semaphore {
    available;
    waiters = [];
    constructor(count) {
        this.available = count;
    }
    async acquire() {
        if (this.available > 0) {
            this.available--;
            return;
        }
        return new Promise((resolve) => {
            this.waiters.push(resolve);
        });
    }
    release() {
        if (this.waiters.length > 0) {
            const resolve = this.waiters.shift();
            if (resolve) {
                resolve();
            }
        }
        else {
            this.available++;
        }
    }
}
/**
 * Parallel processing with concurrency limit
 */
async function processParallel(items, processor, maxConcurrency = 5) {
    if (!Number.isFinite(maxConcurrency) || maxConcurrency < 1) {
        throw new Error(`maxConcurrency must be a finite integer >= 1, got ${maxConcurrency}`);
    }
    const results = [];
    const errors = [];
    const semaphore = new Semaphore(maxConcurrency);
    await Promise.all(items.map(async (item) => {
        await semaphore.acquire();
        try {
            const result = await processor(item);
            results.push(result);
        }
        catch (error) {
            errors.push({
                item,
                error: error instanceof Error ? error : new Error(String(error)),
            });
        }
        finally {
            semaphore.release();
        }
    }));
    return { results, errors };
}
/**
 * Chunk array into smaller arrays
 */
function chunk(array, size) {
    if (!Number.isFinite(size) || size < 1 || !Number.isInteger(size)) {
        throw new Error(`chunk size must be a finite integer >= 1, got ${size}`);
    }
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}
/**
 * Deduplicate array by key function
 */
function deduplicate(array, keyFn) {
    const seen = new Set();
    return array.filter((item) => {
        const key = keyFn(item);
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
}
/**
 * Optimize database inserts with batching
 */
async function batchInsert(items, inserter, batchSize = 1000, maxConcurrency = 5) {
    if (!Number.isFinite(batchSize) || batchSize < 1 || !Number.isInteger(batchSize)) {
        throw new Error(`batchSize must be a finite integer >= 1, got ${batchSize}`);
    }
    if (!Number.isFinite(maxConcurrency) || maxConcurrency < 1 || !Number.isInteger(maxConcurrency)) {
        throw new Error(`maxConcurrency must be a finite integer >= 1, got ${maxConcurrency}`);
    }
    const batches = chunk(items, batchSize);
    const semaphore = new Semaphore(maxConcurrency);
    await Promise.all(batches.map(batch => inserter(batch)));
}
/**
 * Stream processing for large datasets
 */
async function* streamProcess(items, processor, bufferSize = 100) {
    const buffer = [];
    for await (const item of items) {
        const promise = processor(item);
        buffer.push(promise);
        if (buffer.length >= bufferSize) {
            const result = await Promise.race(buffer.map((p, i) => p.then((r) => ({ result: r, index: i }))));
            yield result.result;
            buffer.splice(result.index, 1);
        }
    }
    // Process remaining items
    for (const promise of buffer) {
        yield await promise;
    }
}
/**
 * Memory-efficient processing for very large datasets
 */
async function processLargeDataset(items, processor, batchSize = 1000, maxMemoryMB = 500) {
    const results = [];
    let processed = 0;
    let batch = [];
    for await (const item of items) {
        batch.push(item);
        if (batch.length >= batchSize) {
            const batchResults = await processor(batch);
            results.push(...batchResults);
            processed += batch.length;
            batch = []; // Clear batch to free memory
            // Check memory usage (simplified)
            if (global.gc && process.memoryUsage().heapUsed > maxMemoryMB * 1024 * 1024) {
                global.gc();
            }
        }
    }
    // Process remaining items
    if (batch.length > 0) {
        const batchResults = await processor(batch);
        results.push(...batchResults);
        processed += batch.length;
    }
    return { results, processed };
}
//# sourceMappingURL=batch-processor.js.map