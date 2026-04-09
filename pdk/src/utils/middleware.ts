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
export type Middleware = (
  context: RequestContext,
  next: MiddlewareNext
) => Promise<ResponseContext>;

/**
 * Middleware chain executor
 */
export class MiddlewareChain {
  private middlewares: Middleware[] = [];

  /**
   * Adds a middleware to the chain
   */
  use(middleware: Middleware): void {
    this.middlewares.push(middleware);
  }

  /**
   * Executes the middleware chain
   */
  async execute(
    context: RequestContext,
    handler: (context: RequestContext) => Promise<ResponseContext>
  ): Promise<ResponseContext> {
    let index = 0;

    const next: MiddlewareNext = async (): Promise<ResponseContext> => {
      if (index >= this.middlewares.length) {
        return handler(context);
      }

      const middleware = this.middlewares[index++];
      return middleware(context, next);
    };

    return next();
  }
}

/**
 * Built-in middleware for logging requests and responses
 */
export function createLoggingMiddleware(logger?: {
  info?: (message: string, meta?: unknown) => void;
  error?: (message: string, meta?: unknown) => void;
}): Middleware {
  const log = logger?.info || console.log;
  const logError = logger?.error || console.error;

  return async (context: RequestContext, next: MiddlewareNext) => {
    const startTime = Date.now();
    log(`[Settler SDK] ${context.method} ${context.path}`, {
      method: context.method,
      path: context.path,
      headers: context.headers,
    });

    try {
      const response = await next();
      const duration = Date.now() - startTime;
      log(`[Settler SDK] ${context.method} ${context.path} ${response.status} (${duration}ms)`, {
        method: context.method,
        path: context.path,
        status: response.status,
        duration,
      });
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      logError(`[Settler SDK] ${context.method} ${context.path} ERROR (${duration}ms)`, {
        method: context.method,
        path: context.path,
        error,
        duration,
      });
      throw error;
    }
  };
}

/**
 * Built-in middleware for metrics collection
 */
export function createMetricsMiddleware(metrics?: {
  increment?: (name: string, tags?: Record<string, string>) => void;
  histogram?: (name: string, value: number, tags?: Record<string, string>) => void;
}): Middleware {
  return async (context: RequestContext, next: MiddlewareNext) => {
    const startTime = Date.now();
    metrics?.increment?.("settler.request.started", {
      method: context.method,
      path: context.path,
    });

    try {
      const response = await next();
      const duration = Date.now() - startTime;
      metrics?.histogram?.("settler.request.duration", duration, {
        method: context.method,
        path: context.path,
        status: String(response.status),
      });
      metrics?.increment?.("settler.request.completed", {
        method: context.method,
        path: context.path,
        status: String(response.status),
      });
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      metrics?.histogram?.("settler.request.duration", duration, {
        method: context.method,
        path: context.path,
        status: "error",
      });
      metrics?.increment?.("settler.request.failed", {
        method: context.method,
        path: context.path,
      });
      throw error;
    }
  };
}
