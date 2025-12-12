/**
 * Circuit Breaker Pattern
 * 
 * Prevents cascading failures by stopping requests to failing services.
 * Implements exponential backoff and automatic recovery.
 */

interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failures: number;
  lastFailureTime: number;
  successCount: number;
}

interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeout?: number;
  halfOpenSuccessThreshold?: number;
  monitoringWindow?: number;
}

const DEFAULT_OPTIONS: Required<CircuitBreakerOptions> = {
  failureThreshold: 5,
  resetTimeout: 60000, // 1 minute
  halfOpenSuccessThreshold: 2,
  monitoringWindow: 60000, // 1 minute
};

class CircuitBreaker {
  private state: CircuitBreakerState;
  private options: Required<CircuitBreakerOptions>;
  private name: string;

  constructor(name: string, options: CircuitBreakerOptions = {}) {
    this.name = name;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.state = {
      state: 'closed',
      failures: 0,
      lastFailureTime: 0,
      successCount: 0,
    };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if circuit should be opened
    if (this.state.state === 'open') {
      const timeSinceLastFailure = Date.now() - this.state.lastFailureTime;
      if (timeSinceLastFailure > this.options.resetTimeout) {
        // Move to half-open state
        this.state.state = 'half-open';
        this.state.successCount = 0;
        console.log(`[CircuitBreaker:${this.name}] Moving to half-open state`);
      } else {
        throw new Error(`Circuit breaker is OPEN for ${this.name}. Too many failures.`);
      }
    }

    try {
      const result = await operation();
      
      // Success - reset failure count
      if (this.state.state === 'half-open') {
        this.state.successCount++;
        if (this.state.successCount >= this.options.halfOpenSuccessThreshold) {
          this.state.state = 'closed';
          this.state.failures = 0;
          console.log(`[CircuitBreaker:${this.name}] Circuit closed - service recovered`);
        }
      } else {
        this.state.failures = 0;
      }
      
      return result;
    } catch (error) {
      this.state.failures++;
      this.state.lastFailureTime = Date.now();

      // Open circuit if threshold exceeded
      if (this.state.failures >= this.options.failureThreshold) {
        this.state.state = 'open';
        console.error(`[CircuitBreaker:${this.name}] Circuit OPENED after ${this.state.failures} failures`);
      }

      throw error;
    }
  }

  getState(): CircuitBreakerState {
    return { ...this.state };
  }

  reset(): void {
    this.state = {
      state: 'closed',
      failures: 0,
      lastFailureTime: 0,
      successCount: 0,
    };
  }
}

// Global circuit breakers for different services
const circuitBreakers = new Map<string, CircuitBreaker>();

/**
 * Get or create a circuit breaker for a service
 */
export function getCircuitBreaker(serviceName: string, options?: CircuitBreakerOptions): CircuitBreaker {
  if (!circuitBreakers.has(serviceName)) {
    circuitBreakers.set(serviceName, new CircuitBreaker(serviceName, options));
  }
  return circuitBreakers.get(serviceName)!;
}

/**
 * Execute an operation with circuit breaker protection
 */
export async function withCircuitBreaker<T>(
  serviceName: string,
  operation: () => Promise<T>,
  options?: CircuitBreakerOptions
): Promise<T> {
  const breaker = getCircuitBreaker(serviceName, options);
  return breaker.execute(operation);
}

/**
 * Pre-configured circuit breakers for common services
 */
export const serviceBreakers = {
  database: () => getCircuitBreaker('database', { failureThreshold: 3, resetTimeout: 30000 }),
  supabase: () => getCircuitBreaker('supabase', { failureThreshold: 5, resetTimeout: 60000 }),
  stripe: () => getCircuitBreaker('stripe', { failureThreshold: 3, resetTimeout: 60000 }),
  email: () => getCircuitBreaker('email', { failureThreshold: 5, resetTimeout: 120000 }),
  externalApi: (name: string) => getCircuitBreaker(`external:${name}`, { failureThreshold: 5 }),
};
