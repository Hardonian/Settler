import { JobsClient } from "./clients/jobs";
import { ReportsClient } from "./clients/reports";
import { WebhooksClient } from "./clients/webhooks";
import { AdaptersClient } from "./clients/adapters";
import {
  parseError,
  NetworkError,
  SettlerError,
} from "./errors";
import { withRetry, RetryConfig } from "./utils/retry";
import { withDeduplication } from "./utils/deduplication";
import { TokenManager, TokenInfo } from "./utils/token-refresh";
import {
  MiddlewareChain,
  RequestContext,
  ResponseContext,
  Middleware,
  createLoggingMiddleware,
} from "./utils/middleware";

/**
 * Configuration options for the Settler SDK client
 */
export interface SettlerConfig {
  /** API key for authentication (required) */
  apiKey: string;
  /** Base URL for the API (default: https://api.settler.dev) */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Retry configuration */
  retry?: RetryConfig;
  /** Enable request deduplication (default: true) */
  deduplicateRequests?: boolean;
  /** Token refresh configuration (for JWT tokens) */
  tokenRefresh?: {
    refreshFn: () => Promise<TokenInfo>;
    refreshThreshold?: number;
  };
  /** Custom middleware functions */
  middleware?: Middleware[];
  /** Enable default logging middleware (default: false) */
  enableLogging?: boolean;
  /** Custom logger for logging middleware */
  logger?: {
    info?: (message: string, meta?: unknown) => void;
    error?: (message: string, meta?: unknown) => void;
  };
}

/**
 * Production-grade TypeScript SDK client for Settler API
 * 
 * @example
 * ```typescript
 * const client = new SettlerClient({
 *   apiKey: 'sk_your_api_key',
 *   enableLogging: true,
 * });
 * 
 * const job = await client.jobs.create({
 *   name: 'My Reconciliation Job',
 *   source: { adapter: 'shopify', config: {...} },
 *   target: { adapter: 'stripe', config: {...} },
 *   rules: { matching: [...] },
 * });
 * ```
 */
export class SettlerClient {
  public readonly jobs: JobsClient;
  public readonly reports: ReportsClient;
  public readonly webhooks: WebhooksClient;
  public readonly adapters: AdaptersClient;

  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly retryConfig: RetryConfig;
  private readonly deduplicateRequests: boolean;
  private readonly tokenManager?: TokenManager;
  private readonly middlewareChain: MiddlewareChain;

  /**
   * Creates a new Settler client instance
   * 
   * @param config - Configuration options for the client
   */
  constructor(config: SettlerConfig) {
    if (!config.apiKey) {
      throw new Error("API key is required");
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://api.settler.dev";
    this.timeout = config.timeout || 30000;
    this.retryConfig = config.retry || {};
    this.deduplicateRequests = config.deduplicateRequests !== false;

    // Initialize token manager if refresh function is provided
    if (config.tokenRefresh) {
      this.tokenManager = new TokenManager(config.tokenRefresh);
    }

    // Initialize middleware chain
    this.middlewareChain = new MiddlewareChain();

    // Add custom middleware
    if (config.middleware) {
      config.middleware.forEach((mw) => this.middlewareChain.use(mw));
    }

    // Add logging middleware if enabled
    if (config.enableLogging) {
      this.middlewareChain.use(createLoggingMiddleware(config.logger));
    }

    // Initialize clients
    this.jobs = new JobsClient(this);
    this.reports = new ReportsClient(this);
    this.webhooks = new WebhooksClient(this);
    this.adapters = new AdaptersClient(this);
  }

  /**
   * Adds a middleware to the middleware chain
   * 
   * @param middleware - Middleware function to add
   * 
   * @example
   * ```typescript
   * client.use(async (context, next) => {
   *   console.log('Request:', context.method, context.path);
   *   const response = await next();
   *   console.log('Response:', response.status);
   *   return response;
   * });
   * ```
   */
  use(middleware: Middleware): void {
    this.middlewareChain.use(middleware);
  }

  /**
   * Makes an HTTP request to the Settler API
   * 
   * @param method - HTTP method (GET, POST, PUT, DELETE, etc.)
   * @param path - API path (e.g., '/api/v1/jobs')
   * @param options - Request options (body, query parameters)
   * @returns Promise resolving to the response data
   * 
   * @throws {NetworkError} When network request fails
   * @throws {AuthError} When authentication fails
   * @throws {ValidationError} When request validation fails
   * @throws {RateLimitError} When rate limit is exceeded
   * @throws {ServerError} When server returns an error
   */
  async request<T>(
    method: string,
    path: string,
    options: {
      body?: unknown;
      query?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const requestFn = async (): Promise<T> => {
      const requestContext: RequestContext = {
        method,
        path,
        headers: {},
        body: options.body,
        ...(options.query !== undefined && { query: options.query }),
      };

      // Execute middleware chain
      const response = await this.middlewareChain.execute(
        requestContext,
        async (context: RequestContext): Promise<ResponseContext<T>> => {
          return this.executeRequest(context);
        }
      ) as ResponseContext<T>;

      return response.data;
    };

    // Apply deduplication if enabled
    if (this.deduplicateRequests && method === "GET") {
      return withDeduplication(method, path, options.body, () =>
        withRetry(requestFn, this.retryConfig)
      );
    }

    // Apply retry logic
    return withRetry(requestFn, this.retryConfig);
  }

  /**
   * Internal method to execute the actual HTTP request
   */
  private async executeRequest<T>(
    context: RequestContext
  ): Promise<ResponseContext<T>> {
    const url = new URL(`${this.baseUrl}${context.path}`);

    if (context.query) {
      Object.entries(context.query).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    // Get authentication header
    let authHeader: string;
    if (this.tokenManager) {
      const token = await this.tokenManager.getToken();
      authHeader = `Bearer ${token}`;
    } else {
      authHeader = this.apiKey;
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(this.tokenManager
        ? { Authorization: authHeader }
        : { "X-API-Key": authHeader }),
      ...context.headers,
    };

    const fetchOptions: RequestInit = {
      method: context.method,
      headers,
    };
    
    if (context.body !== undefined && context.body !== null) {
      fetchOptions.body = JSON.stringify(context.body);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url.toString(), {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      // Parse response body
      let data: T;
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const jsonData = await response.json();
        data = jsonData as T;
      } else {
        const textData = await response.text();
        data = textData as unknown as T;
      }

      if (!response.ok) {
        const error = parseError(response, data);
        throw error;
      }

      return {
        status: response.status,
        headers: responseHeaders,
        data,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof SettlerError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new NetworkError(`Request timeout after ${this.timeout}ms`);
        }
        throw new NetworkError(error.message, error);
      }

      throw new NetworkError("Request failed");
    }
  }
}
