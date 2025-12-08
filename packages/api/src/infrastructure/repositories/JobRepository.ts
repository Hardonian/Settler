/**
 * Job Repository Implementation
 * PostgreSQL implementation of IJobRepository
 */

import { query } from '../../db';
import { IJobRepository } from '../../domain/repositories/IJobRepository';

export interface Job {
  id: string;
  userId: string;
  name: string;
  source: Record<string, unknown>;
  target: Record<string, unknown>;
  rules: Record<string, unknown>;
  schedule?: string | null;
  status: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export class JobRepository implements IJobRepository {
  async findById(id: string, userId: string): Promise<Job | null> {
    const results = await query<{
      id: string;
      user_id: string;
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
      `SELECT id, user_id, name, source, target, rules, schedule, status, version, created_at, updated_at
       FROM jobs
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (results.length === 0 || !results[0]) {
      return null;
    }

    const row = results[0];
    return {
      id: row.id,
      userId: row.user_id,
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

  async findByUserId(userId: string, page: number, limit: number): Promise<{ jobs: Job[]; total: number }> {
    const offset = (page - 1) * limit;

    const [jobs, countResult] = await Promise.all([
      query<{
        id: string;
        user_id: string;
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
        `SELECT id, user_id, name, source, target, rules, schedule, status, version, created_at, updated_at
         FROM jobs
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      ),
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM jobs WHERE user_id = $1`,
        [userId]
      ),
    ]);

    return {
      jobs: jobs.map((row) => ({
        id: row.id,
        userId: row.user_id,
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
      total: parseInt(countResult[0]?.count || '0', 10),
    };
  }

  async create(job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<Job> {
    const result = await query<{
      id: string;
      user_id: string;
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
      `INSERT INTO jobs (user_id, name, source, target, rules, schedule, status, version)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, user_id, name, source, target, rules, schedule, status, version, created_at, updated_at`,
      [
        job.userId,
        job.name,
        JSON.stringify(job.source),
        JSON.stringify(job.target),
        JSON.stringify(job.rules),
        job.schedule || null,
        job.status || 'active',
        1,
      ]
    );

    if (!result[0]) {
      throw new Error('Failed to create job');
    }
    const row = result[0];
    return {
      id: row.id,
      userId: row.user_id,
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

  async updateStatus(id: string, userId: string, status: string, expectedVersion: number): Promise<Job | null> {
    const result = await query<{
      id: string;
      user_id: string;
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
      `UPDATE jobs
       SET status = $1, version = version + 1, updated_at = NOW()
       WHERE id = $2 AND user_id = $3 AND version = $4
       RETURNING id, user_id, name, source, target, rules, schedule, status, version, created_at, updated_at`,
      [status, id, userId, expectedVersion]
    );

    if (result.length === 0 || !result[0]) {
      return null;
    }

    const row = result[0];
    return {
      id: row.id,
      userId: row.user_id,
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

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await query<{ id: string }>(
      `DELETE FROM jobs WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );

    return result.length > 0;
  }
}
