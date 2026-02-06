"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantRepository = void 0;
const Tenant_1 = require("../../domain/entities/Tenant");
const db_1 = require("../../db");
const tenant_cache_1 = require("../../utils/tenant-cache");
const cache_invalidation_1 = require("../../utils/cache-invalidation");
class TenantRepository {
    async findById(id) {
        const cacheKey = (0, tenant_cache_1.getTenantCacheKey)("id", id);
        const cached = await (0, tenant_cache_1.getCachedTenantProps)(cacheKey);
        if (cached !== undefined) {
            return cached ? Tenant_1.Tenant.fromPersistence(cached) : null;
        }
        const rows = await (0, db_1.query)(`SELECT * FROM tenants WHERE id = $1 AND deleted_at IS NULL`, [id]);
        const tenant = rows.length > 0 && rows[0] ? Tenant_1.Tenant.fromPersistence(rows[0]) : null;
        await (0, tenant_cache_1.setCachedTenantProps)(cacheKey, rows[0] ?? null);
        return tenant;
    }
    async findBySlug(slug) {
        const cacheKey = (0, tenant_cache_1.getTenantCacheKey)("slug", slug);
        const cached = await (0, tenant_cache_1.getCachedTenantProps)(cacheKey);
        if (cached !== undefined) {
            return cached ? Tenant_1.Tenant.fromPersistence(cached) : null;
        }
        const rows = await (0, db_1.query)(`SELECT * FROM tenants WHERE slug = $1 AND deleted_at IS NULL`, [slug]);
        const tenant = rows.length > 0 && rows[0] ? Tenant_1.Tenant.fromPersistence(rows[0]) : null;
        await (0, tenant_cache_1.setCachedTenantProps)(cacheKey, rows[0] ?? null);
        return tenant;
    }
    async findByCustomDomain(domain) {
        const cacheKey = (0, tenant_cache_1.getTenantCacheKey)("host", domain);
        const cached = await (0, tenant_cache_1.getCachedTenantProps)(cacheKey);
        if (cached !== undefined) {
            return cached ? Tenant_1.Tenant.fromPersistence(cached) : null;
        }
        const rows = await (0, db_1.query)(`SELECT * FROM tenants 
       WHERE config->>'customDomain' = $1 
       AND config->>'customDomainVerified' = 'true'
       AND deleted_at IS NULL`, [domain]);
        const tenant = rows.length > 0 && rows[0] ? Tenant_1.Tenant.fromPersistence(rows[0]) : null;
        await (0, tenant_cache_1.setCachedTenantProps)(cacheKey, rows[0] ?? null);
        return tenant;
    }
    async findSubAccounts(parentTenantId) {
        const rows = await (0, db_1.query)(`SELECT * FROM tenants 
       WHERE parent_tenant_id = $1 AND deleted_at IS NULL`, [parentTenantId]);
        return rows.map((row) => Tenant_1.Tenant.fromPersistence(row));
    }
    async findParentTenant(tenantId) {
        const rows = await (0, db_1.query)(`SELECT parent_tenant_id FROM tenants WHERE id = $1 AND deleted_at IS NULL`, [tenantId]);
        if (rows.length === 0 || !rows[0] || !rows[0].parent_tenant_id) {
            return null;
        }
        return this.findById(rows[0].parent_tenant_id);
    }
    async findAll() {
        const rows = await (0, db_1.query)(`SELECT * FROM tenants WHERE deleted_at IS NULL`);
        return rows.map((row) => Tenant_1.Tenant.fromPersistence(row));
    }
    async save(tenant) {
        const props = tenant.toPersistence();
        await (0, db_1.query)(`INSERT INTO tenants (
        id, name, slug, parent_tenant_id, tier, status, 
        quotas, config, metadata, created_at, updated_at, deleted_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        parent_tenant_id = EXCLUDED.parent_tenant_id,
        tier = EXCLUDED.tier,
        status = EXCLUDED.status,
        quotas = EXCLUDED.quotas,
        config = EXCLUDED.config,
        metadata = EXCLUDED.metadata,
        updated_at = EXCLUDED.updated_at,
        deleted_at = EXCLUDED.deleted_at`, [
            props.id,
            props.name,
            props.slug,
            props.parentTenantId || null,
            props.tier,
            props.status,
            JSON.stringify(props.quotas),
            JSON.stringify(props.config),
            JSON.stringify(props.metadata),
            props.createdAt,
            props.updatedAt,
            props.deletedAt || null,
        ]);
        await (0, cache_invalidation_1.invalidateTenantCache)(tenant.id);
    }
    async delete(id) {
        await (0, db_1.query)(`UPDATE tenants SET deleted_at = NOW() WHERE id = $1`, [id]);
        await (0, cache_invalidation_1.invalidateTenantCache)(id);
    }
}
exports.TenantRepository = TenantRepository;
//# sourceMappingURL=TenantRepository.js.map