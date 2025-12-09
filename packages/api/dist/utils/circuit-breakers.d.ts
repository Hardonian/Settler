/**
 * Circuit Breaker Utilities
 * Prevents cascading failures from external service calls
 */
import { CircuitBreaker } from "opossum";
export interface CircuitBreakerOptions {
    timeout?: number;
    errorThresholdPercentage?: number;
    resetTimeout?: number;
    name?: string;
}
/**
 * Create a circuit breaker for external calls
 */
export declare function createCircuitBreaker<TArgs extends unknown[], TReturn>(fn: (...args: TArgs) => Promise<TReturn>, options?: CircuitBreakerOptions): CircuitBreaker<TReturn>;
/**
 * Circuit breaker for adapter API calls
 */
export declare function createAdapterCircuitBreaker<TArgs extends unknown[], TReturn>(adapterName: string, fn: (...args: TArgs) => Promise<TReturn>): CircuitBreaker<TReturn>;
/**
 * Circuit breaker for webhook deliveries
 */
export declare function createWebhookCircuitBreaker<TArgs extends unknown[], TReturn>(fn: (...args: TArgs) => Promise<TReturn>): CircuitBreaker<TReturn>;
/**
 * Circuit breaker for FX rate provider calls
 */
export declare function createFXRateCircuitBreaker<TArgs extends unknown[], TReturn>(fn: (...args: TArgs) => Promise<TReturn>): CircuitBreaker<TReturn>;
//# sourceMappingURL=circuit-breakers.d.ts.map