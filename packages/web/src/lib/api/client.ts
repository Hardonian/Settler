/**
 * API Client with Resilience
 *
 * Provides a resilient API client with retries, timeouts, circuit breakers,
 * and user-friendly error handling
 */

import { withResilience, ResilienceConfig } from "@/lib/resilience";
import { getErrorMessage, isRetryableError } from "@/lib/ux/error-messages";
import { toast } from "@/lib/ux/toast";

export interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;
  retry?: {
    maxAttempts?: number;
    initialDelay?: number;
  };
  circuitBreaker?: {
    serviceName: string;
  };
  onError?: (error: unknown) => void;
  showToastOnError?: boolean;
}

export class ApiClient {
  private config: Required<Omit<ApiClientConfig, "circuitBreaker" | "onError">> & {
    circuitBreaker?: ApiClientConfig["circuitBreaker"];
    onError?: ApiClientConfig["onError"];
  };

  constructor(config: ApiClientConfig) {
    this.config = {
      timeout: 30000,
      retry: {
        maxAttempts: 3,
        initialDelay: 1000,
      },
      showToastOnError: true,
      ...config,
      baseUrl: config.baseUrl.replace(/\/$/, ""), // Remove trailing slash
    };
  }

  /**
   * Make GET request
   */
  async get<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  /**
   * Make POST request
   */
  async post<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
  }

  /**
   * Make PUT request
   */
  async put<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
  }

  /**
   * Make DELETE request
   */
  async delete<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }

  /**
   * Make request with resilience
   */
  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;

    const resilienceConfig: ResilienceConfig<T> = {
      timeout: this.config.timeout,
      retry: {
        maxAttempts: this.config.retry.maxAttempts,
        initialDelay: this.config.retry.initialDelay,
      },
      circuitBreaker: this.config.circuitBreaker
        ? {
            serviceName: this.config.circuitBreaker.serviceName,
          }
        : undefined,
    };

    try {
      const response = await withResilience(async () => {
        const response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
          },
        });

        if (!response.ok) {
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
          (error as Error & { status: number }).status = response.status;
          throw error;
        }

        return response.json() as Promise<T>;
      }, resilienceConfig);

      return response;
    } catch (error) {
      // Handle error
      if (this.config.onError) {
        this.config.onError(error);
      }

      if (this.config.showToastOnError) {
        const message = getErrorMessage(error);
        if (isRetryableError(error)) {
          toast.error(message, 10000); // Show retryable errors longer
        } else {
          toast.error(message);
        }
      }

      throw error;
    }
  }
}

/**
 * Create API client instance
 */
export function createApiClient(config: ApiClientConfig): ApiClient {
  return new ApiClient(config);
}

/**
 * Default API client (can be configured per route)
 */
export const apiClient = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "/api",
  timeout: 30000,
  retry: {
    maxAttempts: 3,
    initialDelay: 1000,
  },
  showToastOnError: true,
});

/**
 * Fetch JSON with resilience (convenience function)
 */
export async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  return apiClient.get<T>(url, options);
}

/**
 * Fetch with fallback (convenience function)
 */
export async function fetchWithFallback<T>(
  url: string,
  fallback: T | (() => T | Promise<T>),
  options?: RequestInit
): Promise<T> {
  try {
    return await apiClient.get<T>(url, options);
  } catch {
    if (typeof fallback === "function") {
      return await (fallback as () => T | Promise<T>)();
    }
    return fallback;
  }
}

/**
 * Defensive fetch (convenience function with error handling)
 */
export async function defensiveFetch<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    return await apiClient.get<T>(url, options);
  } catch (error) {
    console.error("[defensiveFetch] Failed:", error);
    return null;
  }
}

/**
 * Fetch options type (for compatibility)
 */
export type FetchOptions = RequestInit;
