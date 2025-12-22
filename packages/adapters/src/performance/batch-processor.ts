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

const DEFAULT_BATCH_CONFIG: BatchConfig = {
  batchSize: 100,
  maxConcurrency: 5,
  retryOnFailure: true,
  continueOnError: true,
};

/**
 * Process items in batches with concurrency control
 */
export async function processInBatches<T, R>(
  items: T[],
  processor: (batch: T[]) => Promise<R[]>,
  config: Partial<BatchConfig> = {}
): Promise<{ results: R[]; errors: Array<{ item: T; error: Error }> }> {
  const finalConfig = { ...DEFAULT_BATCH_CONFIG, ...config };
  const results: R[] = [];
  const errors: Array<{ item: T; error: Error }> = [];

  // Split into batches
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += finalConfig.batchSize) {
    batches.push(items.slice(i, i + finalConfig.batchSize));
  }

  // Process batches with concurrency control
  const semaphore = new Semaphore(finalConfig.maxConcurrency);

  await Promise.all(
    batches.map(async (batch) => {
      await semaphore.acquire();
      try {
        const batchResults = await processor(batch);
        results.push(...batchResults);
      } catch (error) {
        if (finalConfig.continueOnError) {
          if (batch.length > 0) {
            errors.push({
              item: batch[0], // Represent batch with first item
              error: error instanceof Error ? error : new Error(String(error)),
            });
          }
        } else {
          throw error;
        }
      } finally {
        semaphore.release();
      }
    })
  );

  return { results, errors };
}

/**
 * Semaphore for concurrency control
 */
class Semaphore {
  private available: number;
  private waiters: Array<() => void> = [];

  constructor(count: number) {
    this.available = count;
  }

  async acquire(): Promise<void> {
    if (this.available > 0) {
      this.available--;
      return;
    }

    return new Promise<void>((resolve) => {
      this.waiters.push(resolve);
    });
  }

  release(): void {
    if (this.waiters.length > 0) {
      const resolve = this.waiters.shift()!;
      resolve();
    } else {
      this.available++;
    }
  }
}

/**
 * Parallel processing with concurrency limit
 */
export async function processParallel<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  maxConcurrency: number = 5
): Promise<{ results: R[]; errors: Array<{ item: T; error: Error }> }> {
  const results: R[] = [];
  const errors: Array<{ item: T; error: Error }> = [];
  const semaphore = new Semaphore(maxConcurrency);

  await Promise.all(
    items.map(async (item) => {
      await semaphore.acquire();
      try {
        const result = await processor(item);
        results.push(result);
      } catch (error) {
        errors.push({
          item,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      } finally {
        semaphore.release();
      }
    })
  );

  return { results, errors };
}

/**
 * Chunk array into smaller arrays
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Deduplicate array by key function
 */
export function deduplicate<T>(array: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
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
export async function batchInsert<T>(
  items: T[],
  inserter: (batch: T[]) => Promise<void>,
  batchSize: number = 1000
): Promise<void> {
  const batches = chunk(items, batchSize);
  
  for (const batch of batches) {
    await inserter(batch);
  }
}

/**
 * Stream processing for large datasets
 */
export async function* streamProcess<T, R>(
  items: AsyncIterable<T> | Iterable<T>,
  processor: (item: T) => Promise<R>,
  bufferSize: number = 100
): AsyncGenerator<R> {
  const buffer: Promise<R>[] = [];
  
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
export async function processLargeDataset<T, R>(
  items: AsyncIterable<T>,
  processor: (batch: T[]) => Promise<R[]>,
  batchSize: number = 1000,
  maxMemoryMB: number = 500
): Promise<{ results: R[]; processed: number }> {
  const results: R[] = [];
  let processed = 0;
  let batch: T[] = [];

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
