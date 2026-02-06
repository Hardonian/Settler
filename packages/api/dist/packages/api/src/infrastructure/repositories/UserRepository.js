"use strict";
/**
 * User Repository Implementation
 * PostgreSQL implementation of IUserRepository
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const User_1 = require("../../domain/entities/User");
const db_1 = require("../../db");
class UserRepository {
    async findById(id) {
        const rows = await (0, db_1.query)(`SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL`, [id]);
        if (rows.length === 0) {
            return null;
        }
        return User_1.User.fromPersistence(this.mapRowToProps(rows[0]));
    }
    async findByEmail(email) {
        const rows = await (0, db_1.query)(`SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL`, [email]);
        if (rows.length === 0) {
            return null;
        }
        return User_1.User.fromPersistence(this.mapRowToProps(rows[0]));
    }
    async save(user) {
        const props = user.toPersistence();
        const existing = await this.findById(props.id);
        if (existing) {
            // Update
            await (0, db_1.query)(`UPDATE users SET
          tenant_id = $1,
          email = $2,
          password_hash = $3,
          name = $4,
          role = $5,
          data_residency_region = $6,
          data_retention_days = $7,
          deleted_at = $8,
          deletion_scheduled_at = $9,
          updated_at = NOW()
        WHERE id = $10`, [
                props.tenantId,
                props.email,
                props.passwordHash,
                props.name ?? null,
                props.role,
                props.dataResidencyRegion,
                props.dataRetentionDays,
                props.deletedAt ?? null,
                props.deletionScheduledAt ?? null,
                props.id,
            ]);
        }
        else {
            // Insert
            await (0, db_1.query)(`INSERT INTO users (
          id, tenant_id, email, password_hash, name, role,
          data_residency_region, data_retention_days,
          deleted_at, deletion_scheduled_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`, [
                props.id,
                props.tenantId,
                props.email,
                props.passwordHash,
                props.name ?? null,
                props.role,
                props.dataResidencyRegion,
                props.dataRetentionDays,
                props.deletedAt ?? null,
                props.deletionScheduledAt ?? null,
            ]);
        }
        return user;
    }
    async delete(id) {
        await (0, db_1.query)(`UPDATE users SET deleted_at = NOW() WHERE id = $1`, [id]);
    }
    async findAll(limit, offset) {
        const rows = await (0, db_1.query)(`SELECT * FROM users WHERE deleted_at IS NULL
       ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
        return rows.map((row) => User_1.User.fromPersistence(this.mapRowToProps(row)));
    }
    async count() {
        const rows = await (0, db_1.query)(`SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL`);
        if (!rows[0]) {
            return 0;
        }
        return parseInt(rows[0].count, 10);
    }
    mapRowToProps(row) {
        const props = {
            id: row.id,
            tenantId: row.tenant_id,
            email: row.email,
            passwordHash: row.password_hash,
            role: row.role,
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
exports.UserRepository = UserRepository;
//# sourceMappingURL=UserRepository.js.map