"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettlerClient = void 0;
const jobs_1 = require("./clients/jobs");
const reports_1 = require("./clients/reports");
const webhooks_1 = require("./clients/webhooks");
const adapters_1 = require("./clients/adapters");
const receipts_1 = require("./clients/receipts");
const flags_1 = require("./clients/flags");
const convert_1 = require("./clients/convert");
const console_1 = require("./clients/console");
const errors_1 = require("./errors");
const retry_1 = require("./utils/retry");
const deduplication_1 = require("./utils/deduplication");
const token_refresh_1 = require("./utils/token-refresh");
const middleware_1 = require("./utils/middleware");
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
class SettlerClient {
    jobs;
    reports;
    webhooks;
    adapters;
    receipts;
    flags;
    convert;
    console;
    apiKey;
    baseUrl;
    timeout;
    retryConfig;
    deduplicateRequests;
    tokenManager;
    middlewareChain;
    /**
     * Creates a new Settler client instance
     *
     * @param config - Configuration options for the client
     */
    constructor(config) {
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
            this.tokenManager = new token_refresh_1.TokenManager(config.tokenRefresh);
        }
        // Initialize middleware chain
        this.middlewareChain = new middleware_1.MiddlewareChain();
        // Add custom middleware
        if (config.middleware) {
            config.middleware.forEach((mw) => this.middlewareChain.use(mw));
        }
        // Add logging middleware if enabled
        if (config.enableLogging) {
            this.middlewareChain.use((0, middleware_1.createLoggingMiddleware)(config.logger));
        }
        // Initialize clients
        this.jobs = new jobs_1.JobsClient(this);
        this.reports = new reports_1.ReportsClient(this);
        this.webhooks = new webhooks_1.WebhooksClient(this);
        this.adapters = new adapters_1.AdaptersClient(this);
        this.receipts = new receipts_1.ReceiptsClient(this);
        this.flags = new flags_1.FlagsClient(this);
        this.convert = new convert_1.ConvertClient(this);
        this.console = new console_1.ConsoleClient(this);
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
    use(middleware) {
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
    async request(method, path, options = {}) {
        const requestFn = async () => {
            const requestContext = {
                method,
                path,
                headers: {},
                body: options.body,
                ...(options.query !== undefined && { query: options.query }),
            };
            // Execute middleware chain
            const response = await this.middlewareChain.execute(requestContext, async (context) => {
                return this.executeRequest(context);
            });
            return response.data;
        };
        // Apply deduplication if enabled
        if (this.deduplicateRequests && method === "GET") {
            return (0, deduplication_1.withDeduplication)(method, path, options.body, () => (0, retry_1.withRetry)(requestFn, this.retryConfig));
        }
        // Apply retry logic
        return (0, retry_1.withRetry)(requestFn, this.retryConfig);
    }
    /**
     * Internal method to execute the actual HTTP request
     */
    async executeRequest(context) {
        const url = new URL(`${this.baseUrl}${context.path}`);
        if (context.query) {
            Object.entries(context.query).forEach(([key, value]) => {
                url.searchParams.append(key, value);
            });
        }
        // Get authentication header
        // Support both Bearer token (for session auth) and X-API-Key (for API key auth)
        let authHeader;
        let useBearer = false;
        if (this.tokenManager) {
            const token = await this.tokenManager.getToken();
            authHeader = token;
            useBearer = true;
        }
        else if (this.apiKey.startsWith('rk_')) {
            // API key format
            authHeader = this.apiKey;
            useBearer = false;
        }
        else {
            // Assume Bearer token
            authHeader = this.apiKey;
            useBearer = true;
        }
        const headers = {
            "Content-Type": "application/json",
            ...(useBearer
                ? { Authorization: `Bearer ${authHeader}` }
                : { "X-API-Key": authHeader }),
            ...context.headers,
        };
        const fetchOptions = {
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
            const responseHeaders = {};
            response.headers.forEach((value, key) => {
                responseHeaders[key] = value;
            });
            // Parse response body
            let data;
            const contentType = response.headers.get("content-type");
            if (contentType?.includes("application/json")) {
                const jsonData = await response.json();
                data = jsonData;
            }
            else {
                const textData = await response.text();
                data = textData;
            }
            if (!response.ok) {
                const error = (0, errors_1.parseError)(response, data);
                throw error;
            }
            return {
                status: response.status,
                headers: responseHeaders,
                data,
            };
        }
        catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof errors_1.SettlerError) {
                throw error;
            }
            if (error instanceof Error) {
                if (error.name === "AbortError") {
                    throw new errors_1.NetworkError(`Request timeout after ${this.timeout}ms`);
                }
                throw new errors_1.NetworkError(error.message, error);
            }
            throw new errors_1.NetworkError("Request failed");
        }
    }
}
exports.SettlerClient = SettlerClient;
//# sourceMappingURL=client.js.map