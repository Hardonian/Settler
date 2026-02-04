import { cacheKey, get, set, del } from "./cache";
import { TenantProps } from "../domain/entities/Tenant";

export interface TenantCacheEntry {
  found: boolean;
  tenant: TenantProps | null;
}

export const TENANT_CACHE_TTL_SECONDS = 60;
const TENANT_CACHE_INDEX_TTL_SECONDS = 300;

type TenantLookupType = "id" | "slug" | "host";

export function getTenantCacheKey(type: TenantLookupType, value: string): string {
  return cacheKey("tenant", "lookup", type, value);
}

export function getTenantCacheIndexKey(tenantId: string): string {
  return cacheKey("tenant", "lookup", "index", tenantId);
}

export async function getCachedTenantProps(key: string): Promise<TenantProps | null | undefined> {
  const cached = await get<TenantCacheEntry>(key);
  if (!cached) {
    return undefined;
  }
  return cached.found ? cached.tenant : null;
}

export async function setCachedTenantProps(key: string, tenant: TenantProps | null): Promise<void> {
  const entry: TenantCacheEntry = {
    found: Boolean(tenant),
    tenant,
  };

  await set(key, entry, TENANT_CACHE_TTL_SECONDS);

  if (tenant?.id) {
    await recordTenantCacheKey(tenant.id, key);
  }
}

export async function recordTenantCacheKey(tenantId: string, key: string): Promise<void> {
  const indexKey = getTenantCacheIndexKey(tenantId);
  const cachedKeys = (await get<string[]>(indexKey)) ?? [];
  if (!cachedKeys.includes(key)) {
    cachedKeys.push(key);
  }
  await set(indexKey, cachedKeys, TENANT_CACHE_INDEX_TTL_SECONDS);
}

export async function invalidateTenantCacheKeys(tenantId: string): Promise<void> {
  const indexKey = getTenantCacheIndexKey(tenantId);
  const cachedKeys = await get<string[]>(indexKey);

  if (cachedKeys && cachedKeys.length > 0) {
    for (const key of cachedKeys) {
      await del(key);
    }
  }

  await del(indexKey);
}
