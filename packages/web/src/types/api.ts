/**
 * API Request/Response Types
 *
 * Common types for API route handlers to eliminate 'any' usage
 */

export type ApiRequestBody = Record<string, unknown>;

export interface ApiErrorResponse {
  error: string;
  details?: unknown;
}

export interface ApiSuccessResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Type-safe request body parser
 */
export async function parseRequestBody<T extends Record<string, unknown>>(
  request: Request
): Promise<T> {
  return (await request.json()) as T;
}

/**
 * Type-safe Supabase RPC call wrapper
 */
export function createRpcCall<TArgs extends Record<string, unknown>, TReturn>(rpcName: string) {
  return async (
    supabase: {
      rpc: (name: string, args: TArgs) => Promise<{ data: TReturn | null; error: unknown }>;
    },
    args: TArgs
  ): Promise<{ data: TReturn | null; error: unknown }> => {
    return await (
      supabase.rpc as (
        name: string,
        args: TArgs
      ) => Promise<{ data: TReturn | null; error: unknown }>
    )(rpcName, args);
  };
}

/**
 * Type-safe RPC call helper
 */
export function safeRpcCall<TArgs extends Record<string, unknown>, TReturn>(
  supabase: { rpc: unknown },
  rpcName: string,
  args: TArgs
): Promise<{ data: TReturn | null; error: unknown }> {
  const rpcFn = supabase.rpc as unknown as (
    name: string,
    args: TArgs
  ) => Promise<{ data: TReturn | null; error: unknown }>;
  return rpcFn(rpcName, args);
}
