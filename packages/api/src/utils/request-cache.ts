import { Request } from "express";

const requestCacheSymbol = Symbol("requestCache");

export function getRequestCache(req: Request): Map<string, unknown> {
  const reqWithCache = req as Request & { [requestCacheSymbol]?: Map<string, unknown> };
  if (!reqWithCache[requestCacheSymbol]) {
    reqWithCache[requestCacheSymbol] = new Map();
  }
  return reqWithCache[requestCacheSymbol]!;
}

export async function memoizeRequestValue<T>(
  req: Request,
  key: string,
  factory: () => Promise<T>
): Promise<T> {
  const cache = getRequestCache(req);
  if (cache.has(key)) {
    return cache.get(key) as T;
  }

  const value = await factory();
  cache.set(key, value);
  return value;
}
