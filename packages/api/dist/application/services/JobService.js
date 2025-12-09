"use strict";
/**
 * Job Service
 * Application service for reconciliation job operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobService = void 0;
const Job_1 = require("../../domain/entities/Job");
const encryption_1 = require("../../infrastructure/security/encryption");
const DomainEvent_1 = require("../../domain/events/DomainEvent");
class JobService {
    jobRepository;
    eventBus;
    constructor(jobRepository, eventBus) {
        this.jobRepository = jobRepository;
        this.eventBus = eventBus;
    }
    async createJob(command) {
        // Encrypt adapter configurations
        const sourceConfigEncrypted = await (0, encryption_1.encrypt)(JSON.stringify(command.sourceConfig));
        const targetConfigEncrypted = await (0, encryption_1.encrypt)(JSON.stringify(command.targetConfig));
        // Create job entity
        const jobProps = {
            userId: command.userId,
            name: command.name,
            sourceAdapter: command.sourceAdapter,
            sourceConfigEncrypted,
            targetAdapter: command.targetAdapter,
            targetConfigEncrypted,
            rules: command.rules,
        };
        if (command.schedule !== undefined) {
            jobProps.schedule = command.schedule;
        }
        const job = Job_1.Job.create(jobProps);
        // Convert to repository format and save
        const persistedJobProps = job.toPersistence();
        const savedJob = await this.jobRepository.create({
            userId: persistedJobProps.userId,
            name: persistedJobProps.name,
            source: {
                adapter: persistedJobProps.sourceAdapter,
                configEncrypted: persistedJobProps.sourceConfigEncrypted,
            },
            target: {
                adapter: persistedJobProps.targetAdapter,
                configEncrypted: persistedJobProps.targetConfigEncrypted,
            },
            rules: persistedJobProps.rules,
            schedule: persistedJobProps.schedule || null,
            status: persistedJobProps.status,
            version: persistedJobProps.version,
        });
        // Emit domain event
        await this.eventBus.publish(new DomainEvent_1.JobCreatedEvent(savedJob.id, savedJob.userId, savedJob.name));
        return {
            jobId: savedJob.id,
            name: savedJob.name,
            status: savedJob.status,
        };
    }
    async getJob(query) {
        const jobData = await this.jobRepository.findById(query.jobId, query.userId);
        if (!jobData) {
            throw new Error('Job not found');
        }
        // Convert repository format to domain format
        const source = jobData.source;
        const target = jobData.target;
        const rules = jobData.rules;
        const result = {
            id: jobData.id,
            userId: jobData.userId,
            name: jobData.name,
            sourceAdapter: source.adapter,
            targetAdapter: target.adapter,
            rules: rules,
            status: jobData.status,
            createdAt: jobData.createdAt,
            updatedAt: jobData.updatedAt,
        };
        if (jobData.schedule) {
            result.schedule = jobData.schedule;
        }
        return result;
    }
    async listJobs(query) {
        const page = Math.floor(query.offset / query.limit) + 1;
        const result = await this.jobRepository.findByUserId(query.userId, page, query.limit);
        return {
            jobs: result.jobs.map((jobData) => {
                const source = jobData.source;
                const target = jobData.target;
                return {
                    id: jobData.id,
                    name: jobData.name,
                    sourceAdapter: source.adapter,
                    targetAdapter: target.adapter,
                    status: jobData.status,
                    createdAt: jobData.createdAt,
                    updatedAt: jobData.updatedAt,
                };
            }),
            total: result.total,
            limit: query.limit,
            offset: query.offset,
        };
    }
    async updateJob(jobId, userId, updates) {
        const jobData = await this.jobRepository.findById(jobId, userId);
        if (!jobData) {
            throw new Error('Job not found');
        }
        // Convert repository format to domain entity
        const source = jobData.source;
        const target = jobData.target;
        const rules = jobData.rules;
        const jobPropsForPersistence = {
            id: jobData.id,
            userId: jobData.userId,
            name: jobData.name,
            sourceAdapter: source.adapter,
            sourceConfigEncrypted: source.configEncrypted,
            targetAdapter: target.adapter,
            targetConfigEncrypted: target.configEncrypted,
            rules,
            status: jobData.status,
            version: jobData.version,
            createdAt: jobData.createdAt,
            updatedAt: jobData.updatedAt,
        };
        if (jobData.schedule) {
            jobPropsForPersistence.schedule = jobData.schedule;
        }
        const job = Job_1.Job.fromPersistence(jobPropsForPersistence);
        const changes = {};
        if (updates.name) {
            // In a real implementation, we'd have an updateName method
            changes.name = updates.name;
        }
        if (updates.rules) {
            job.updateRules(updates.rules);
            changes.rules = updates.rules;
        }
        if (updates.schedule !== undefined) {
            job.updateSchedule(updates.schedule);
            changes.schedule = updates.schedule;
        }
        if (updates.sourceConfig || updates.targetConfig) {
            const sourceConfigEncrypted = updates.sourceConfig
                ? await (0, encryption_1.encrypt)(JSON.stringify(updates.sourceConfig))
                : job.sourceConfigEncrypted;
            const targetConfigEncrypted = updates.targetConfig
                ? await (0, encryption_1.encrypt)(JSON.stringify(updates.targetConfig))
                : job.targetConfigEncrypted;
            job.updateConfigs(sourceConfigEncrypted, targetConfigEncrypted);
            changes.configs = 'updated';
        }
        // Note: Repository doesn't have update method, so we'd need to implement it
        // For now, this is a placeholder
        const jobProps = job.toPersistence();
        await this.jobRepository.updateStatus(jobProps.id, jobProps.userId, jobProps.status, jobProps.version);
        // Emit domain event
        await this.eventBus.publish(new DomainEvent_1.JobUpdatedEvent(jobProps.id, jobProps.userId, changes));
    }
    async deleteJob(jobId, userId) {
        const deleted = await this.jobRepository.delete(jobId, userId);
        if (!deleted) {
            throw new Error('Job not found');
        }
    }
}
exports.JobService = JobService;
//# sourceMappingURL=JobService.js.map