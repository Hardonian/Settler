import { Router, Response } from "express";
import { z } from "zod";
import { validateRequest } from "../middleware/validation";
import { AuthRequest } from "../middleware/auth";
import { requirePermission, requireResourceOwnership } from "../middleware/authorization";
import { Permission } from "../infrastructure/security/Permissions";
import { query } from "../db";
import { logInfo, logError } from "../utils/logger";
import { Mutex } from "async-mutex";
import { JobRouteService } from "../application/services/JobRouteService";
import { sendSuccess, sendError, sendCreated, sendNoContent } from "../utils/api-response";
import { handleRouteError } from "../utils/error-handler";
import { trackEventAsync } from "../utils/event-tracker";
import { validateAdapterConfig } from "../utils/adapter-config-validator";

const router = Router();
const jobService = new JobRouteService();

// Per-job mutex to prevent concurrent execution
// Cleanup mutexes after 1 hour of inactivity to prevent memory leaks
const jobMutexes = new Map<string, { mutex: Mutex; lastUsed: number }>();
const MUTEX_TTL = 60 * 60 * 1000; // 1 hour

function getJobMutex(jobId: string): Mutex {
  const entry = jobMutexes.get(jobId);
  if (entry) {
    entry.lastUsed = Date.now();
    return entry.mutex;
  }
  
  const mutex = new Mutex();
  jobMutexes.set(jobId, { mutex, lastUsed: Date.now() });
  return mutex;
}

// Cleanup old mutexes periodically
function cleanupOldMutexes(): void {
  const now = Date.now();
  for (const [jobId, entry] of jobMutexes.entries()) {
    if (now - entry.lastUsed > MUTEX_TTL) {
      jobMutexes.delete(jobId);
    }
  }
}

// Run cleanup every 30 minutes
setInterval(cleanupOldMutexes, 30 * 60 * 1000);

// Validation schemas with input sanitization
const adapterConfigSchema = z.record(
  z.union([
    z.string().max(1000),
    z.number(),
    z.boolean(),
    z.array(z.string().max(1000)),
  ])
).refine(
  (config) => {
    // Prevent prototype pollution
    return !('__proto__' in config || 'constructor' in config || 'prototype' in config);
  },
  { message: 'Invalid config keys' }
);

const createJobSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    source: z.object({
      adapter: z.string().min(1).max(50),
      config: adapterConfigSchema,
    }),
    target: z.object({
      adapter: z.string().min(1).max(50),
      config: adapterConfigSchema,
    }),
    rules: z.object({
      matching: z.array(z.object({
        field: z.string(),
        type: z.enum(["exact", "fuzzy", "range"]),
        tolerance: z.number().optional(),
        days: z.number().optional(),
        threshold: z.number().optional(),
      })),
      conflictResolution: z.enum(["first-wins", "last-wins", "manual-review"]).optional(),
    }),
    schedule: z.string().optional(), // Cron expression
  }),
});

const getJobSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

const paginationSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default("1"),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default("100"),
  }),
});

// Create reconciliation job
router.post(
  "/",
  requirePermission(Permission.JOBS_WRITE),
  validateRequest(createJobSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      
      // Validate adapter configs (UX-002)
      validateAdapterConfig(req.body.source.adapter, req.body.source.config);
      validateAdapterConfig(req.body.target.adapter, req.body.target.config);
      
      const job = await jobService.createJob(userId, req.body);
      
      // Track event
      trackEventAsync(userId, 'JobCreated', {
        jobId: job.id,
        sourceAdapter: req.body.source.adapter,
        targetAdapter: req.body.target.adapter,
        hasSchedule: !!req.body.schedule,
      });
      
      sendCreated(res, job, "Reconciliation job created successfully");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create reconciliation job";
      logError('Failed to create job', error, { userId: req.userId });
      sendError(res, 500, 'INTERNAL_ERROR', message, undefined, req.traceId);
    }
  }
);

// Get all jobs with pagination
router.get(
  "/",
  requirePermission(Permission.JOBS_READ),
  validateRequest(paginationSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
      const offset = (page - 1) * limit;

      const [jobs, totalResult] = await Promise.all([
        query<{
          id: string;
          name: string;
          status: string;
          created_at: Date;
        }>(
          `SELECT id, name, status, created_at
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
        throw new Error('Failed to get job count');
      }
      const total = parseInt(totalResult[0].count);

      res.json({
        data: jobs.map(job => ({
          id: job.id,
          userId,
          name: job.name,
          status: job.status,
          createdAt: job.created_at.toISOString(),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to fetch jobs", 500, { userId: req.userId });
    }
  }
);

// Get job by ID
router.get(
  "/:id",
  requirePermission(Permission.JOBS_READ),
  validateRequest(getJobSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      if (!id || !userId) {
        return sendError(res, 400, 'BAD_REQUEST', 'Job ID and User ID are required', undefined, req.traceId);
      }

      // Check ownership
      await new Promise<void>((resolve, reject) => {
        requireResourceOwnership(req, res, (err?: unknown) => {
          if (err) reject(err);
          else resolve();
        }, 'job', id);
      });

      const job = await jobService.getJob(id, userId);
      if (!job) {
        return sendError(res, 404, 'NOT_FOUND', 'Job not found', undefined, req.traceId);
      }

      sendSuccess(res, job);
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to fetch job", 500, { userId: req.userId, jobId: req.params.id });
    }
  }
);

// Trigger job execution with race condition prevention
router.post(
  "/:id/run",
  requirePermission(Permission.JOBS_WRITE),
  validateRequest(getJobSchema),
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.userId!;
    
    if (!id || !userId) {
      return sendError(res, 400, 'BAD_REQUEST', 'Job ID and User ID are required', undefined, req.traceId);
    }
    
    const mutex = getJobMutex(id);

    const release = await mutex.acquire();
    try {
      // Check ownership
      await new Promise<void>((resolve, reject) => {
        requireResourceOwnership(req, res, (err?: unknown) => {
          if (err) reject(err);
          else resolve();
        }, 'job', id);
      });

      // Check if job is already running (optimistic locking)
      const jobs = await query<{ status: string; version: number }>(
        `SELECT status, version FROM jobs WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );

      if (jobs.length === 0 || !jobs[0]) {
        return sendError(res, 404, 'NOT_FOUND', 'Job not found', undefined, req.traceId);
      }

      const job = jobs[0];

      if (job.status === 'running') {
        return sendError(res, 409, 'CONFLICT', 'Job is already running', undefined, req.traceId);
      }

      // Update job status atomically
      const updated = await query<{ id: string }>(
        `UPDATE jobs
         SET status = 'running', version = version + 1, updated_at = NOW()
         WHERE id = $1 AND user_id = $2 AND version = $3
         RETURNING id`,
        [id, userId, job.version]
      );

      if (updated.length === 0 || !updated[0]) {
        return sendError(res, 409, 'CONFLICT', 'Job state changed, please retry', undefined, req.traceId);
      }

      // Create execution record
      const executions = await query<{ id: string }>(
        `INSERT INTO executions (job_id, status)
         VALUES ($1, 'running')
         RETURNING id`,
        [id]
      );

      if (executions.length === 0 || !executions[0]) {
        return sendError(res, 500, 'INTERNAL_ERROR', 'Failed to create execution record', undefined, req.traceId);
      }

      const executionId = executions[0].id;

      // Log audit event
      await query<{ id: string }>(
        `INSERT INTO audit_logs (event, user_id, metadata)
         VALUES ($1, $2, $3)`,
        [
          'job_executed',
          userId,
          JSON.stringify({ jobId: id, executionId }),
        ]
      );

      // Queue job execution (async)
      // In production, this would use a job queue like Bull
      setTimeout(async () => {
        try {
          // Execute reconciliation logic here
          await query(
            `UPDATE executions SET status = 'completed', completed_at = NOW()
             WHERE id = $1`,
            [executionId]
          );
          await query(
            `UPDATE jobs SET status = 'active', updated_at = NOW() WHERE id = $1`,
            [id]
          );
        } catch (error) {
          logError('Job execution failed', error, { executionId, jobId: id });
          await query(
            `UPDATE executions SET status = 'failed', error = $1 WHERE id = $2`,
            [error instanceof Error ? error.message : 'Unknown error', executionId]
          );
          await query(
            `UPDATE jobs SET status = 'active', updated_at = NOW() WHERE id = $1`,
            [id]
          );
        }
      }, 0);

      logInfo('Job execution started', { jobId: id, executionId, userId });

      res.status(202).json({
        data: {
          id: executionId,
          jobId: id,
          status: "running",
          startedAt: new Date().toISOString(),
        },
        message: "Job execution started",
      });
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to start job execution", 500, { userId, jobId: id });
    } finally {
      release();
    }
  }
);

// Delete job
router.delete(
  "/:id",
  requirePermission(Permission.JOBS_DELETE),
  validateRequest(getJobSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      if (!id || !userId) {
        return sendError(res, 400, 'BAD_REQUEST', 'Job ID and User ID are required', undefined, req.traceId);
      }

      // Check ownership
      await new Promise<void>((resolve, reject) => {
        requireResourceOwnership(req, res, (err?: unknown) => {
          if (err) reject(err);
          else resolve();
        }, 'job', id);
      });

      const deleted = await jobService.deleteJob(id, userId);
      if (!deleted) {
        return sendError(res, 404, 'NOT_FOUND', 'Job not found', undefined, req.traceId);
      }

      sendNoContent(res);
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to delete job", 500, { userId: req.userId, jobId: req.params.id });
    }
  }
);

export { router as jobsRouter };
