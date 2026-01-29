import { JobsClient } from "./clients/jobs";
import { ReportsClient } from "./clients/reports";
import { WebhooksClient } from "./clients/webhooks";
import { AdaptersClient } from "./clients/adapters";
import { ReceiptsClient } from "./clients/receipts";
import { FlagsClient } from "./clients/flags";
import { ConvertClient } from "./clients/convert";
import { ConsoleClient } from "./clients/console";
import { RetryConfig } from "./utils/retry";
import { TokenInfo } from "./utils/token-refresh";
import { Middleware } from "./utils/middleware";
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
export declare class SettlerClient {
    readonly jobs: JobsClient;
    readonly reports: ReportsClient;
    readonly webhooks: WebhooksClient;
    readonly adapters: AdaptersClient;
    readonly receipts: ReceiptsClient;
    readonly flags: FlagsClient;
    readonly convert: ConvertClient;
    readonly console: ConsoleClient;
    private readonly apiKey;
    private readonly baseUrl;
    private readonly timeout;
    private readonly retryConfig;
    private readonly deduplicateRequests;
    private readonly tokenManager?;
    private readonly middlewareChain;
    /**
     * Creates a new Settler client instance
     *
     * @param config - Configuration options for the client
     */
    constructor(config: SettlerConfig);
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
    use(middleware: Middleware): void;
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
    request<T>(method: string, path: string, options?: {
        body?: unknown;
        query?: Record<string, string>;
    }): Promise<T>;
    /**
     * Internal method to execute the actual HTTP request
     */
    private executeRequest;
}
//# sourceMappingURL=client.d.ts.map