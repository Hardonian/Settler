/**
 * Circuit Breaker Pattern Implementation
 * 
 * Prevents cascading failures by stopping requests to failing services
 * and allowing them to recover.
 */

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening circuit
  resetTimeout: number; // Time in ms before attempting to close circuit
  monitoringPeriod: number; // Time window for failure counting
  halfOpenMaxCalls: number; // Max calls in half-open state
}

export enum CircuitState {
  CLOSED = 'closed', // Normal operation
  OPEN = 'open', // Circuit is open, requests fail fast
  HALF_OPEN = 'half-open', // Testing if service recovered
}

interface CircuitBreakerMetrics {
  failures: number;
  successes: number;
  lastFailureTime: number | null;
  state: CircuitState;
  halfOpenCalls: number;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeout: 60000, // 60 seconds
  monitoringPeriod: 60000, // 60 seconds
  halfOpenMaxCalls: 3,
};

export class CircuitBreaker {
  private config: CircuitBreakerConfig;
  private metrics: CircuitBreakerMetrics;
  private failureWindow: number[] = []; // Timestamps of recent failures

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.metrics = {
      failures: 0,
      successes: 0,
      lastFailureTime: null,
      state: CircuitState.CLOSED,
      halfOpenCalls: 0,
    };
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check circuit state
    this.updateState();

    if (this.metrics.state === CircuitState.OPEN) {
      throw new CircuitBreakerOpenError('Circuit breaker is open');
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Update circuit state based on metrics
   */
  private updateState(): void {
    const now = Date.now();

    // Clean old failures outside monitoring period
    this.failureWindow = this.failureWindow.filter(
      (timestamp) => now - timestamp < this.config.monitoringPeriod
    );

    // Update failure count
    this.metrics.failures = this.failureWindow.length;

    switch (this.metrics.state) {
      case CircuitState.CLOSED:
        // Check if we should open circuit
        if (this.metrics.failures >= this.config.failureThreshold) {
          this.metrics.state = CircuitState.OPEN;
          this.metrics.lastFailureTime = now;
          console.warn('[CircuitBreaker] Circuit opened due to failures:', this.metrics.failures);
        }
        break;

      case CircuitState.OPEN:
        // Check if reset timeout has passed
        if (
          this.metrics.lastFailureTime &&
          now - this.metrics.lastFailureTime >= this.config.resetTimeout
        ) {
          this.metrics.state = CircuitState.HALF_OPEN;
          this.metrics.halfOpenCalls = 0;
          console.info('[CircuitBreaker] Circuit moved to half-open state');
        }
        break;

      case CircuitState.HALF_OPEN:
        // Check if we've exceeded half-open max calls
        if (this.metrics.halfOpenCalls >= this.config.halfOpenMaxCalls) {
          // If we got here without success, reopen circuit
          if (this.metrics.failures > 0) {
            this.metrics.state = CircuitState.OPEN;
            this.metrics.lastFailureTime = now;
            console.warn('[CircuitBreaker] Circuit reopened after half-open failures');
          } else {
            // Success! Close circuit
            this.metrics.state = CircuitState.CLOSED;
            this.metrics.failures = 0;
            this.failureWindow = [];
            console.info('[CircuitBreaker] Circuit closed after successful half-open');
          }
        }
        break;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    if (this.metrics.state === CircuitState.HALF_OPEN) {
      this.metrics.halfOpenCalls++;
      // If we have successes in half-open, close circuit
      if (this.metrics.halfOpenCalls >= this.config.halfOpenMaxCalls) {
        this.metrics.state = CircuitState.CLOSED;
        this.metrics.failures = 0;
        this.failureWindow = [];
        this.metrics.halfOpenCalls = 0;
        console.info('[CircuitBreaker] Circuit closed after successful recovery');
      }
    } else {
      this.metrics.successes++;
      // Reset failure count on success (circuit is closed)
      if (this.metrics.state === CircuitState.CLOSED) {
        this.metrics.failures = 0;
        this.failureWindow = [];
      }
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    const now = Date.now();
    this.failureWindow.push(now);
    this.metrics.failures = this.failureWindow.length;
    this.metrics.lastFailureTime = now;

    if (this.metrics.state === CircuitState.HALF_OPEN) {
      this.metrics.halfOpenCalls++;
      // Failure in half-open state, reopen circuit
      this.metrics.state = CircuitState.OPEN;
      this.metrics.lastFailureTime = now;
      console.warn('[CircuitBreaker] Circuit reopened after half-open failure');
    }
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    this.updateState();
    return this.metrics.state;
  }

  /**
   * Get metrics
   */
  getMetrics(): Readonly<CircuitBreakerMetrics> {
    return { ...this.metrics };
  }

  /**
   * Manually reset circuit breaker
   */
  reset(): void {
    this.metrics = {
      failures: 0,
      successes: 0,
      lastFailureTime: null,
      state: CircuitState.CLOSED,
      halfOpenCalls: 0,
    };
    this.failureWindow = [];
    console.info('[CircuitBreaker] Circuit manually reset');
  }
}

export class CircuitBreakerOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitBreakerOpenError';
  }
}

/**
 * Create circuit breaker instance for a service
 */
const circuitBreakers = new Map<string, CircuitBreaker>();

export function getCircuitBreaker(serviceName: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
  if (!circuitBreakers.has(serviceName)) {
    circuitBreakers.set(serviceName, new CircuitBreaker(config));
  }
  return circuitBreakers.get(serviceName)!;
}

/**
 * Execute function with circuit breaker
 */
export async function withCircuitBreaker<T>(
  serviceName: string,
  fn: () => Promise<T>,
  config?: Partial<CircuitBreakerConfig>
): Promise<T> {
  const breaker = getCircuitBreaker(serviceName, config);
  return breaker.execute(fn);
}
