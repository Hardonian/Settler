/**
 * Circuit Breaker Implementation
 * Prevents cascading failures by opening circuit after threshold failures
 */
import { CircuitBreaker } from 'opossum';
export interface CircuitBreakerConfig {
    timeout?: number;
    errorThresholdPercentage?: number;
    resetTimeout?: number;
    name?: string;
}
/**
 * Create a circuit breaker for a function
 */
export declare function createCircuitBreaker<T extends unknown[], R>(fn: (...args: T) => Promise<R>, config?: CircuitBreakerConfig): CircuitBreaker<R>;
/**
 * Circuit breaker for external API calls
 */
export declare function createApiCircuitBreaker<T extends unknown[], R>(fn: (...args: T) => Promise<R>, apiName: string): CircuitBreaker<R>;
//# sourceMappingURL=circuit-breaker.d.ts.map