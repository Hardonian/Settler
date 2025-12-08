/**
 * Job Route Service
 * Business logic for job-related routes
 * Extracted from route handlers for better testability and maintainability
 */

import { query } from '../../db';
import { encrypt, decrypt } from '../../infrastructure/security/encryption';
import { logInfo, logError } from '../../utils/logger';

export interface CreateJobRequest {
  name: string;
  source: {
    adapter: string;
    config: Record<string, unknown>;
  };
  target: {
    adapter: string;
    config: Record<string, unknown>;
  };
  rules: {
    matching: Array<{
      field: string;
      type: 'exact' | 'fuzzy' | 'range';
      tolerance?: number;
      days?: number;
      threshold?: number;
    }>;
    conflictResolution?: 'first-wins' | 'last-wins' | 'manual-review';
  };
  schedule?: string;
}

export interface JobResponse {
  id: string;
  userId: string;
  name: string;
  source: { adapter: string; config?: Record<string, unknown> };
  target: { adapter: string; config?: Record<string, unknown> };
  rules: CreateJobRequest['rules'];
  schedule?: string;
  status: string;
  createdAt: string;
}

export class JobRouteService {
  /**
   * Create a new reconciliation job
   */
  async createJob(userId: string, request: CreateJobRequest): Promise<JobResponse> {
    try {
      const { name, source, target, rules, schedule } = request;

      // Encrypt API keys in configs
      const encryptedSourceConfig = encrypt(JSON.stringify(source.config));
      const encryptedTargetConfig = encrypt(JSON.stringify(target.config));

      const result = await query<{ id: string }>(
        `INSERT INTO jobs (user_id, name, source_adapter, source_config_encrypted, target_adapter, target_config_encrypted, rules, schedule)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          userId,
          name,
          source.adapter,
          encryptedSourceConfig,
          target.adapter,
          encryptedTargetConfig,
          JSON.stringify(rules),
          schedule || null,
        ]
      );

      if (!result[0]) {
        throw new Error('Failed to create job');
      }
      const jobId = result[0].id;

      // Log audit event
      await query(
        `INSERT INTO audit_logs (event, user_id, metadata)
         VALUES ($1, $2, $3)`,
        [
          'job_created',
          userId,
          JSON.stringify({ jobId, name }),
        ]
      );

      logInfo('Job created', { jobId, userId, name });

      const response: JobResponse = {
        id: jobId,
        userId,
        name,
        source: { adapter: source.adapter },
        target: { adapter: target.adapter },
        rules,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      if (schedule !== undefined) {
        response.schedule = schedule;
      }
      return response;
    } catch (error: unknown) {
      logError('Failed to create job', error, { userId });
      const message = error instanceof Error ? error.message : 'Failed to create reconciliation job';
      throw new Error(message);
    }
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string, userId: string): Promise<JobResponse | null> {
    const jobs = await query<{
      id: string;
      user_id: string;
      name: string;
      source_adapter: string;
      source_config_encrypted: string;
      target_adapter: string;
      target_config_encrypted: string;
      rules: string;
      schedule: string | null;
      status: string;
      created_at: Date;
    }>(
      `SELECT id, user_id, name, source_adapter, source_config_encrypted, target_adapter, target_config_encrypted, rules, schedule, status, created_at
       FROM jobs
       WHERE id = $1 AND user_id = $2`,
      [jobId, userId]
    );

    if (jobs.length === 0) {
      return null;
    }

    const job = jobs[0];
    if (!job) {
      return null;
    }

    // Decrypt configs (but don't expose full API keys in response)
    const sourceConfig = JSON.parse(decrypt(job.source_config_encrypted));
    const targetConfig = JSON.parse(decrypt(job.target_config_encrypted));

    // Redact sensitive fields
    const redactedSourceConfig = Object.fromEntries(
      Object.entries(sourceConfig).map(([key, value]) => [
        key,
        key.toLowerCase().includes('key') || key.toLowerCase().includes('secret')
          ? '***'
          : value,
      ])
    );

    const redactedTargetConfig = Object.fromEntries(
      Object.entries(targetConfig).map(([key, value]) => [
        key,
        key.toLowerCase().includes('key') || key.toLowerCase().includes('secret')
          ? '***'
          : value,
      ])
    );

    const response: JobResponse = {
      id: job.id,
      userId: job.user_id,
      name: job.name,
      source: {
        adapter: job.source_adapter,
        config: redactedSourceConfig,
      },
      target: {
        adapter: job.target_adapter,
        config: redactedTargetConfig,
      },
      rules: JSON.parse(job.rules),
      status: job.status,
      createdAt: job.created_at.toISOString(),
    };
    if (job.schedule) {
      response.schedule = job.schedule;
    }
    return response;
  }

  /**
   * List jobs with pagination
   */
  async listJobs(
    userId: string,
    page: number = 1,
    limit: number = 100
  ): Promise<{ jobs: JobResponse[]; total: number }> {
    const offset = (page - 1) * limit;

    const [jobs, totalResult] = await Promise.all([
      query<{
        id: string;
        user_id: string;
        name: string;
        source_adapter: string;
        target_adapter: string;
        status: string;
        created_at: Date;
      }>(
        `SELECT id, user_id, name, source_adapter, target_adapter, status, created_at
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

    if (!totalResult[0]) {
      return { jobs: [], total: 0 };
    }
    const total = parseInt(totalResult[0].count, 10);

    const defaultRules: CreateJobRequest['rules'] = {
      matching: [],
    };

    return {
      jobs: jobs.map((job) => {
        const response: JobResponse = {
          id: job.id,
          userId: job.user_id,
          name: job.name,
          source: { adapter: job.source_adapter },
          target: { adapter: job.target_adapter },
          rules: defaultRules,
          status: job.status,
          createdAt: job.created_at.toISOString(),
        };
        return response;
      }),
      total,
    };
  }

  /**
   * Delete a job
   */
  async deleteJob(jobId: string, userId: string): Promise<boolean> {
    const result = await query<{ id: string }>(
      `DELETE FROM jobs
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [jobId, userId]
    );

    if (result.length === 0) {
      return false;
    }

    // Log audit event
    await query(
      `INSERT INTO audit_logs (event, user_id, metadata)
       VALUES ($1, $2, $3)`,
      [
        'job_deleted',
        userId,
        JSON.stringify({ jobId }),
      ]
    );

    logInfo('Job deleted', { jobId, userId });

    return true;
  }
}
