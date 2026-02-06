"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TENANT_CACHE_TTL_SECONDS = void 0;
exports.getTenantCacheKey = getTenantCacheKey;
exports.getTenantCacheIndexKey = getTenantCacheIndexKey;
exports.getCachedTenantProps = getCachedTenantProps;
exports.setCachedTenantProps = setCachedTenantProps;
exports.recordTenantCacheKey = recordTenantCacheKey;
exports.invalidateTenantCacheKeys = invalidateTenantCacheKeys;
const cache_1 = require("./cache");
exports.TENANT_CACHE_TTL_SECONDS = 60;
const TENANT_CACHE_INDEX_TTL_SECONDS = 300;
function getTenantCacheKey(type, value) {
    return (0, cache_1.cacheKey)("tenant", "lookup", type, value);
}
function getTenantCacheIndexKey(tenantId) {
    return (0, cache_1.cacheKey)("tenant", "lookup", "index", tenantId);
}
async function getCachedTenantProps(key) {
    const cached = await (0, cache_1.get)(key);
    if (!cached) {
        return undefined;
    }
    return cached.found ? cached.tenant : null;
}
async function setCachedTenantProps(key, tenant) {
    const entry = {
        found: Boolean(tenant),
        tenant,
    };
    await (0, cache_1.set)(key, entry, exports.TENANT_CACHE_TTL_SECONDS);
    if (tenant?.id) {
        await recordTenantCacheKey(tenant.id, key);
    }
}
async function recordTenantCacheKey(tenantId, key) {
    const indexKey = getTenantCacheIndexKey(tenantId);
    const cachedKeys = (await (0, cache_1.get)(indexKey)) ?? [];
    if (!cachedKeys.includes(key)) {
        cachedKeys.push(key);
    }
    await (0, cache_1.set)(indexKey, cachedKeys, TENANT_CACHE_INDEX_TTL_SECONDS);
}
async function invalidateTenantCacheKeys(tenantId) {
    const indexKey = getTenantCacheIndexKey(tenantId);
    const cachedKeys = await (0, cache_1.get)(indexKey);
    if (cachedKeys && cachedKeys.length > 0) {
        for (const key of cachedKeys) {
            await (0, cache_1.del)(key);
        }
    }
    await (0, cache_1.del)(indexKey);
}
//# sourceMappingURL=tenant-cache.js.map