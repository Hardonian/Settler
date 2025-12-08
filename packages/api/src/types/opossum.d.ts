declare module "opossum" {
  export interface Options {
    timeout?: number;
    errorThresholdPercentage?: number;
    resetTimeout?: number;
    rollingCountTimeout?: number;
    rollingCountBuckets?: number;
    name?: string;
    group?: string;
    enabled?: boolean;
    allowWarmUp?: boolean;
    volumeThreshold?: number;
  }

  export interface CircuitBreakerStats {
    fires: number;
    cacheHits: number;
    cacheMisses: number;
    failures: number;
    fallbacks: number;
    rejects: number;
    timeouts: number;
    successes: number;
    semaphoreRejects: number;
    percentiles: Record<string, number>;
    latencyTimes: number[];
  }

  export class CircuitBreaker<T = unknown> {
    constructor(action: (...args: unknown[]) => Promise<T>, options?: Options);
    fire(...args: unknown[]): Promise<T>;
    open(): void;
    close(): void;
    halfOpen(): void;
    enable(): void;
    disable(): void;
    on(event: string, listener: (...args: unknown[]) => void): void;
    removeListener(event: string, listener: (...args: unknown[]) => void): void;
    removeAllListeners(event?: string): void;
    stats: CircuitBreakerStats;
  }

  export type CircuitBreakerOptions = Options;
}
