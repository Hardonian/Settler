/**
 * Job Repository Implementation
 * PostgreSQL implementation of IJobRepository
 *
 * SECURITY: This repository enforces tenant isolation via:
 * 1. Tenant-scoped queries (queryWithTenant) that set RLS context
 * 2. Runtime validation of tenantId parameter
 * 3. Database RLS policies as defense-in-depth
 */

import { queryWithTenant } from "../../db";
import { IJobRepository, type Job } from "../../domain/repositories/IJobRepository";

interface JobRow {
  id: string;
  user_id: string;
  tenant_id: string;
  name: string;
  source: string;
  target: string;
  rules: string;
  schedule: string | null;
  status: string;
  version: number;
  created_at: Date;
  updated_at: Date;
}

function mapRowToJob(row: JobRow): Job {
  return {
    id: row.id,
    userId: row.user_id,
    tenantId: row.tenant_id,
    name: row.name,
    source: JSON.parse(row.source),
    target: JSON.parse(row.target),
    rules: JSON.parse(row.rules),
    schedule: row.schedule,
    status: row.status,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class JobRepository implements IJobRepository {
  async findById(id: string, tenantId: string, userId: string): Promise<Job | null> {
    const results = await queryWithTenant<{
      id: string;
      user_id: string;
      tenant_id: string;
      name: string;
      source: string;
      target: string;
      rules: string;
      schedule: string | null;
      status: string;
      version: number;
      created_at: Date;
      updated_at: Date;
    }>(
      tenantId,
      `SELECT id, user_id, tenant_id, name, source, target, rules, schedule, status, version, created_at, updated_at
       FROM jobs
       WHERE id = $1 AND user_id = $2 AND tenant_id = $3`,
      [id, userId, tenantId]
    );

    if (results.length === 0 || !results[0]) {
      return null;
    }

    return mapRowToJob(results[0]);
  }

  async findByUserId(
    tenantId: string,
    userId: string,
    page: number,
    limit: number
  ): Promise<{ jobs: Job[]; total: number }> {
    const offset = (page - 1) * limit;

    const [jobs, countResult] = await Promise.all([
      queryWithTenant<{
        id: string;
        user_id: string;
        tenant_id: string;
        name: string;
        source: string;
        target: string;
        rules: string;
        schedule: string | null;
        status: string;
        version: number;
        created_at: Date;
        updated_at: Date;
      }>(
        tenantId,
        `SELECT id, user_id, tenant_id, name, source, target, rules, schedule, status, version, created_at, updated_at
         FROM jobs
         WHERE user_id = $1 AND tenant_id = $2
         ORDER BY created_at DESC
         LIMIT $3 OFFSET $4`,
        [userId, tenantId, limit, offset]
      ),
      queryWithTenant<{ count: string }>(
        tenantId,
        `SELECT COUNT(*) as count FROM jobs WHERE user_id = $1`,
        [userId]
      ),
    ]);

    return {
      jobs: jobs.map((row) => ({
        id: row.id,
        userId: row.user_id,
        tenantId: row.tenant_id,
        name: row.name,
        source: JSON.parse(row.source),
        target: JSON.parse(row.target),
        rules: JSON.parse(row.rules),
        schedule: row.schedule,
        status: row.status,
        version: row.version,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
      total: parseInt(countResult[0]?.count || "0", 10),
    };
  }

  async create(tenantId: string, job: Omit<Job, "id" | "createdAt" | "updatedAt">): Promise<Job> {
    const result = await queryWithTenant<{
      id: string;
      user_id: string;
      tenant_id: string;
      name: string;
      source: string;
      target: string;
      rules: string;
      schedule: string | null;
      status: string;
      version: number;
      created_at: Date;
      updated_at: Date;
    }>(
      tenantId,
      `INSERT INTO jobs (user_id, tenant_id, name, source_adapter, target_adapter, source_config_encrypted, target_config_encrypted, rules)
       VALUES ($1, $2, $3, 'stripe', 'shopify', $4, $5, $6)
       RETURNING id, user_id, tenant_id, source_adapter as source, target_adapter as target, name, rules, schedule, status, version, created_at, updated_at`,
      [
        job.userId,
        tenantId,
        job.name,
        JSON.stringify(job.source),
        JSON.stringify(job.target),
        JSON.stringify(job.rules),
      ]
    );

    if (!result[0]) {
      throw new Error("Failed to create job");
    }
    const row = result[0];
    return {
      id: row.id,
      userId: row.user_id,
      tenantId: row.tenant_id,
      name: row.name,
      source: JSON.parse(row.source || "{}"),
      target: JSON.parse(row.target || "{}"),
      rules: JSON.parse(row.rules || "{}"),
      schedule: row.schedule,
      status: row.status,
      version: row.version,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async updateStatus(
    id: string,
    tenantId: string,
    userId: string,
    status: string,
    expectedVersion: number
  ): Promise<Job | null> {
    const result = await queryWithTenant<{
      id: string;
      user_id: string;
      tenant_id: string;
      name: string;
      source: string;
      target: string;
      rules: string;
      schedule: string | null;
      status: string;
      version: number;
      created_at: Date;
      updated_at: Date;
    }>(
      tenantId,
      `UPDATE jobs
       SET status = $1, version = version + 1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3 AND version = $4
       RETURNING id, user_id, tenant_id, source_adapter as source, target_adapter as target, name, rules, schedule, status, version, created_at, updated_at`,
      [status, id, userId, expectedVersion]
    );

    if (result.length === 0 || !result[0]) {
      return null;
    }

    const row = result[0];
    return {
      id: row.id,
      userId: row.user_id,
      tenantId: row.tenant_id,
      name: row.name,
      source: JSON.parse(row.source || "{}"),
      target: JSON.parse(row.target || "{}"),
      rules: JSON.parse(row.rules || "{}"),
      schedule: row.schedule,
      status: row.status,
      version: row.version,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async delete(id: string, tenantId: string, userId: string): Promise<boolean> {
    const result = await queryWithTenant<{ id: string }>(
      tenantId,
      `DELETE FROM jobs WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );

    return result.length > 0;
  }
}
