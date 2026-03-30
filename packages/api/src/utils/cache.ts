const cache = new Map<string, { value: any; expires: number }>();

export function withCache<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const cached = cache.get(key);

  if (cached && cached.expires > now) {
    return Promise.resolve(cached.value as T);
  }

  return fn().then((value) => {
    cache.set(key, { value, expires: now + ttl });
    return value;
  });
}
