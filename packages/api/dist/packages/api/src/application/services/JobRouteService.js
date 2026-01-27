"use strict";
/**
 * Job Route Service
 * Business logic for job-related routes
 * Extracted from route handlers for better testability and maintainability
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobRouteService = void 0;
const db_1 = require("../../db");
const encryption_1 = require("../../infrastructure/security/encryption");
const logger_1 = require("../../utils/logger");
class JobRouteService {
    /**
     * Create a new reconciliation job
     */
    async createJob(userId, request) {
        try {
            const { name, source, target, rules, schedule } = request;
            // Encrypt API keys in configs
            const encryptedSourceConfig = (0, encryption_1.encrypt)(JSON.stringify(source.config));
            const encryptedTargetConfig = (0, encryption_1.encrypt)(JSON.stringify(target.config));
            const result = await (0, db_1.query)(`INSERT INTO jobs (user_id, name, source_adapter, source_config_encrypted, target_adapter, target_config_encrypted, rules, schedule)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`, [
                userId,
                name,
                source.adapter,
                encryptedSourceConfig,
                target.adapter,
                encryptedTargetConfig,
                JSON.stringify(rules),
                schedule || null,
            ]);
            if (!result[0]) {
                throw new Error('Failed to create job');
            }
            const jobId = result[0].id;
            // Log audit event
            await (0, db_1.query)(`INSERT INTO audit_logs (event, user_id, metadata)
         VALUES ($1, $2, $3)`, [
                'job_created',
                userId,
                JSON.stringify({ jobId, name }),
            ]);
            (0, logger_1.logInfo)('Job created', { jobId, userId, name });
            const response = {
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
        }
        catch (error) {
            (0, logger_1.logError)('Failed to create job', error, { userId });
            const message = error instanceof Error ? error.message : 'Failed to create reconciliation job';
            throw new Error(message);
        }
    }
    /**
     * Get job by ID
     */
    async getJob(jobId, userId) {
        const jobs = await (0, db_1.query)(`SELECT id, user_id, name, source_adapter, source_config_encrypted, target_adapter, target_config_encrypted, rules, schedule, status, created_at
       FROM jobs
       WHERE id = $1 AND user_id = $2`, [jobId, userId]);
        if (jobs.length === 0) {
            return null;
        }
        const job = jobs[0];
        if (!job) {
            return null;
        }
        // Decrypt configs (but don't expose full API keys in response)
        const sourceConfig = JSON.parse((0, encryption_1.decrypt)(job.source_config_encrypted));
        const targetConfig = JSON.parse((0, encryption_1.decrypt)(job.target_config_encrypted));
        // Redact sensitive fields
        const redactedSourceConfig = Object.fromEntries(Object.entries(sourceConfig).map(([key, value]) => [
            key,
            key.toLowerCase().includes('key') || key.toLowerCase().includes('secret')
                ? '***'
                : value,
        ]));
        const redactedTargetConfig = Object.fromEntries(Object.entries(targetConfig).map(([key, value]) => [
            key,
            key.toLowerCase().includes('key') || key.toLowerCase().includes('secret')
                ? '***'
                : value,
        ]));
        const response = {
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
    async listJobs(userId, page = 1, limit = 100) {
        const offset = (page - 1) * limit;
        const [jobs, totalResult] = await Promise.all([
            (0, db_1.query)(`SELECT id, user_id, name, source_adapter, target_adapter, status, created_at
         FROM jobs
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`, [userId, limit, offset]),
            (0, db_1.query)(`SELECT COUNT(*) as count FROM jobs WHERE user_id = $1`, [userId]),
        ]);
        if (!totalResult[0]) {
            return { jobs: [], total: 0 };
        }
        const total = parseInt(totalResult[0].count, 10);
        const defaultRules = {
            matching: [],
        };
        return {
            jobs: jobs.map((job) => {
                const response = {
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
    async deleteJob(jobId, userId) {
        const result = await (0, db_1.query)(`DELETE FROM jobs
       WHERE id = $1 AND user_id = $2
       RETURNING id`, [jobId, userId]);
        if (result.length === 0) {
            return false;
        }
        // Log audit event
        await (0, db_1.query)(`INSERT INTO audit_logs (event, user_id, metadata)
       VALUES ($1, $2, $3)`, [
            'job_deleted',
            userId,
            JSON.stringify({ jobId }),
        ]);
        (0, logger_1.logInfo)('Job deleted', { jobId, userId });
        return true;
    }
}
exports.JobRouteService = JobRouteService;
//# sourceMappingURL=JobRouteService.js.map