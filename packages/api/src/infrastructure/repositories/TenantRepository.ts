import { ITenantRepository } from '../../domain/repositories/ITenantRepository';
import { Tenant, TenantProps } from '../../domain/entities/Tenant';
import { query } from '../../db';

export class TenantRepository implements ITenantRepository {
  async findById(id: string): Promise<Tenant | null> {
    const rows = await query<TenantProps>(
      `SELECT * FROM tenants WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    return rows.length > 0 && rows[0] ? Tenant.fromPersistence(rows[0]) : null;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const rows = await query<TenantProps>(
      `SELECT * FROM tenants WHERE slug = $1 AND deleted_at IS NULL`,
      [slug]
    );
    return rows.length > 0 && rows[0] ? Tenant.fromPersistence(rows[0]) : null;
  }

  async findByCustomDomain(domain: string): Promise<Tenant | null> {
    const rows = await query<TenantProps>(
      `SELECT * FROM tenants 
       WHERE config->>'customDomain' = $1 
       AND config->>'customDomainVerified' = 'true'
       AND deleted_at IS NULL`,
      [domain]
    );
    return rows.length > 0 && rows[0] ? Tenant.fromPersistence(rows[0]) : null;
  }

  async findSubAccounts(parentTenantId: string): Promise<Tenant[]> {
    const rows = await query<TenantProps>(
      `SELECT * FROM tenants 
       WHERE parent_tenant_id = $1 AND deleted_at IS NULL`,
      [parentTenantId]
    );
    return rows.map(row => Tenant.fromPersistence(row));
  }

  async findParentTenant(tenantId: string): Promise<Tenant | null> {
    const rows = await query<{ parent_tenant_id: string }>(
      `SELECT parent_tenant_id FROM tenants WHERE id = $1 AND deleted_at IS NULL`,
      [tenantId]
    );
    if (rows.length === 0 || !rows[0] || !rows[0].parent_tenant_id) {
      return null;
    }
    return this.findById(rows[0].parent_tenant_id);
  }

  async findAll(): Promise<Tenant[]> {
    const rows = await query<TenantProps>(
      `SELECT * FROM tenants WHERE deleted_at IS NULL`
    );
    return rows.map(row => Tenant.fromPersistence(row));
  }

  async save(tenant: Tenant): Promise<void> {
    const props = tenant.toPersistence();
    await query(
      `INSERT INTO tenants (
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
        deleted_at = EXCLUDED.deleted_at`,
      [
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
      ]
    );
  }

  async delete(id: string): Promise<void> {
    await query(`UPDATE tenants SET deleted_at = NOW() WHERE id = $1`, [id]);
  }
}
