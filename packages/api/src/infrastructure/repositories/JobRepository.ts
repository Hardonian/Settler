/**
 * Job Repository Implementation
 * PostgreSQL implementation of IJobRepository
 *
 * INVARIANT: Every query is scoped by tenant_id. No cross-tenant data access is possible.
 */

import { query } from "../../db";
import { IJobRepository, Job } from "../../domain/repositories/IJobRepository";

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
  async findById(id: string, userId: string, tenantId: string): Promise<Job | null> {
    if (!tenantId) throw new Error("tenantId is required for findById");
    const results = await query<JobRow>(
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
    userId: string,
    tenantId: string,
    page: number,
    limit: number
  ): Promise<{ jobs: Job[]; total: number }> {
    if (!tenantId) throw new Error("tenantId is required for findByUserId");
    const offset = (page - 1) * limit;

    const [jobs, countResult] = await Promise.all([
      query<JobRow>(
        `SELECT id, user_id, tenant_id, name, source, target, rules, schedule, status, version, created_at, updated_at
         FROM jobs
         WHERE user_id = $1 AND tenant_id = $2
         ORDER BY created_at DESC
         LIMIT $3 OFFSET $4`,
        [userId, tenantId, limit, offset]
      ),
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM jobs WHERE user_id = $1 AND tenant_id = $2`,
        [userId, tenantId]
      ),
    ]);

    return {
      jobs: jobs.map(mapRowToJob),
      total: parseInt(countResult[0]?.count || "0", 10),
    };
  }

  async create(job: Omit<Job, "id" | "createdAt" | "updatedAt">): Promise<Job> {
    if (!job.tenantId) throw new Error("tenantId is required for create");
    const result = await query<JobRow>(
      `INSERT INTO jobs (user_id, tenant_id, name, source, target, rules, schedule, status, version)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, user_id, tenant_id, name, source, target, rules, schedule, status, version, created_at, updated_at`,
      [
        job.userId,
        job.tenantId,
        job.name,
        JSON.stringify(job.source),
        JSON.stringify(job.target),
        JSON.stringify(job.rules),
        job.schedule || null,
        job.status || "active",
        1,
      ]
    );

    if (!result[0]) {
      throw new Error("Failed to create job");
    }
    return mapRowToJob(result[0]);
  }

  async updateStatus(
    id: string,
    userId: string,
    tenantId: string,
    status: string,
    expectedVersion: number
  ): Promise<Job | null> {
    if (!tenantId) throw new Error("tenantId is required for updateStatus");
    const result = await query<JobRow>(
      `UPDATE jobs
       SET status = $1, version = version + 1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3 AND tenant_id = $4 AND version = $5
       RETURNING id, user_id, tenant_id, name, source, target, rules, schedule, status, version, created_at, updated_at`,
      [status, id, userId, tenantId, expectedVersion]
    );

    if (result.length === 0 || !result[0]) {
      return null;
    }

    return mapRowToJob(result[0]);
  }

  async delete(id: string, userId: string, tenantId: string): Promise<boolean> {
    if (!tenantId) throw new Error("tenantId is required for delete");
    const result = await query<{ id: string }>(
      `DELETE FROM jobs WHERE id = $1 AND user_id = $2 AND tenant_id = $3 RETURNING id`,
      [id, userId, tenantId]
    );

    return result.length > 0;
  }
}
