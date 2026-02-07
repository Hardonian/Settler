/**
 * User Repository Implementation
 * PostgreSQL implementation of IUserRepository
 *
 * INVARIANT: Every query is scoped by tenant_id. No cross-tenant data access is possible.
 */

import { User, UserRole, UserProps } from "../../domain/entities/User";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { query } from "../../db";

export class UserRepository implements IUserRepository {
  async findById(id: string, tenantId: string): Promise<User | null> {
    if (!tenantId) throw new Error("tenantId is required for findById");
    const rows = await query<UserProps>(
      `SELECT * FROM users WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
      [id, tenantId]
    );

    if (rows.length === 0) {
      return null;
    }

    return User.fromPersistence(this.mapRowToProps(rows[0]));
  }

  async findByEmail(email: string, tenantId: string): Promise<User | null> {
    if (!tenantId) throw new Error("tenantId is required for findByEmail");
    const rows = await query<UserProps>(
      `SELECT * FROM users WHERE email = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
      [email, tenantId]
    );

    if (rows.length === 0) {
      return null;
    }

    return User.fromPersistence(this.mapRowToProps(rows[0]));
  }

  async save(user: User, tenantId: string): Promise<User> {
    if (!tenantId) throw new Error("tenantId is required for save");
    const props = user.toPersistence();

    // Enforce: the user's tenantId must match the scoped tenantId
    if (props.tenantId && props.tenantId !== tenantId) {
      throw new Error("Tenant mismatch: cannot save user to a different tenant");
    }

    const existing = await this.findById(props.id, tenantId);

    if (existing) {
      // Update — scoped by both id AND tenant_id
      await query(
        `UPDATE users SET
          email = $1,
          password_hash = $2,
          name = $3,
          role = $4,
          data_residency_region = $5,
          data_retention_days = $6,
          deleted_at = $7,
          deletion_scheduled_at = $8,
          updated_at = NOW()
        WHERE id = $9 AND tenant_id = $10`,
        [
          props.email,
          props.passwordHash,
          props.name ?? null,
          props.role,
          props.dataResidencyRegion,
          props.dataRetentionDays,
          props.deletedAt ?? null,
          props.deletionScheduledAt ?? null,
          props.id,
          tenantId,
        ]
      );
    } else {
      // Insert
      await query(
        `INSERT INTO users (
          id, tenant_id, email, password_hash, name, role,
          data_residency_region, data_retention_days,
          deleted_at, deletion_scheduled_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
        [
          props.id,
          tenantId,
          props.email,
          props.passwordHash,
          props.name ?? null,
          props.role,
          props.dataResidencyRegion,
          props.dataRetentionDays,
          props.deletedAt ?? null,
          props.deletionScheduledAt ?? null,
        ]
      );
    }

    return user;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    if (!tenantId) throw new Error("tenantId is required for delete");
    await query(`UPDATE users SET deleted_at = NOW() WHERE id = $1 AND tenant_id = $2`, [
      id,
      tenantId,
    ]);
  }

  async findAll(tenantId: string, limit: number, offset: number): Promise<User[]> {
    if (!tenantId) throw new Error("tenantId is required for findAll");
    const rows = await query<UserProps>(
      `SELECT * FROM users WHERE tenant_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    );

    return rows.map((row) => User.fromPersistence(this.mapRowToProps(row)));
  }

  async count(tenantId: string): Promise<number> {
    if (!tenantId) throw new Error("tenantId is required for count");
    const rows = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM users WHERE tenant_id = $1 AND deleted_at IS NULL`,
      [tenantId]
    );
    if (!rows[0]) {
      return 0;
    }
    return parseInt(rows[0].count, 10);
  }

  private mapRowToProps(row: any): UserProps {
    const props: UserProps = {
      id: row.id,
      tenantId: row.tenant_id,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role as UserRole,
      dataResidencyRegion: row.data_residency_region,
      dataRetentionDays: row.data_retention_days,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
    if (row.name !== null && row.name !== undefined) {
      props.name = row.name;
    }
    if (row.deleted_at) {
      props.deletedAt = new Date(row.deleted_at);
    }
    if (row.deletion_scheduled_at) {
      props.deletionScheduledAt = new Date(row.deletion_scheduled_at);
    }
    return props;
  }
}
