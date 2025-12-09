"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantRepository = void 0;
const Tenant_1 = require("../../domain/entities/Tenant");
const db_1 = require("../../db");
class TenantRepository {
    async findById(id) {
        const rows = await (0, db_1.query)(`SELECT * FROM tenants WHERE id = $1 AND deleted_at IS NULL`, [id]);
        return rows.length > 0 && rows[0] ? Tenant_1.Tenant.fromPersistence(rows[0]) : null;
    }
    async findBySlug(slug) {
        const rows = await (0, db_1.query)(`SELECT * FROM tenants WHERE slug = $1 AND deleted_at IS NULL`, [slug]);
        return rows.length > 0 && rows[0] ? Tenant_1.Tenant.fromPersistence(rows[0]) : null;
    }
    async findByCustomDomain(domain) {
        const rows = await (0, db_1.query)(`SELECT * FROM tenants 
       WHERE config->>'customDomain' = $1 
       AND config->>'customDomainVerified' = 'true'
       AND deleted_at IS NULL`, [domain]);
        return rows.length > 0 && rows[0] ? Tenant_1.Tenant.fromPersistence(rows[0]) : null;
    }
    async findSubAccounts(parentTenantId) {
        const rows = await (0, db_1.query)(`SELECT * FROM tenants 
       WHERE parent_tenant_id = $1 AND deleted_at IS NULL`, [parentTenantId]);
        return rows.map(row => Tenant_1.Tenant.fromPersistence(row));
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
        return rows.map(row => Tenant_1.Tenant.fromPersistence(row));
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
    }
    async delete(id) {
        await (0, db_1.query)(`UPDATE tenants SET deleted_at = NOW() WHERE id = $1`, [id]);
    }
}
exports.TenantRepository = TenantRepository;
//# sourceMappingURL=TenantRepository.js.map