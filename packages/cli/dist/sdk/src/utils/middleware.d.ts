/**
 * Middleware system for request/response interception and transformation
 */
export interface RequestContext {
    method: string;
    path: string;
    headers: Record<string, string>;
    body?: unknown;
    query?: Record<string, string>;
}
export interface ResponseContext<T = unknown> {
    status: number;
    headers: Record<string, string>;
    data: T;
}
export type MiddlewareNext = () => Promise<ResponseContext>;
export type Middleware = (context: RequestContext, next: MiddlewareNext) => Promise<ResponseContext>;
/**
 * Middleware chain executor
 */
export declare class MiddlewareChain {
    private middlewares;
    /**
     * Adds a middleware to the chain
     */
    use(middleware: Middleware): void;
    /**
     * Executes the middleware chain
     */
    execute(context: RequestContext, handler: (context: RequestContext) => Promise<ResponseContext>): Promise<ResponseContext>;
}
/**
 * Built-in middleware for logging requests and responses
 */
export declare function createLoggingMiddleware(logger?: {
    info?: (message: string, meta?: unknown) => void;
    error?: (message: string, meta?: unknown) => void;
}): Middleware;
/**
 * Built-in middleware for metrics collection
 */
export declare function createMetricsMiddleware(metrics?: {
    increment?: (name: string, tags?: Record<string, string>) => void;
    histogram?: (name: string, value: number, tags?: Record<string, string>) => void;
}): Middleware;
//# sourceMappingURL=middleware.d.ts.map