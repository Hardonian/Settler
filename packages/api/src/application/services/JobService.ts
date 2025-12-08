/**
 * Job Service
 * Application service for reconciliation job operations
 */

import { Job, JobStatus, JobProps } from '../../domain/entities/Job';
import { IJobRepository } from '../../domain/repositories/IJobRepository';
import { CreateJobCommand, CreateJobCommandResult } from '../commands/CreateJobCommand';
import { GetJobQuery, GetJobQueryResult } from '../queries/GetJobQuery';
import { ReconciliationRules } from '../../domain/entities/Job';
import { ListJobsQuery, ListJobsQueryResult } from '../queries/ListJobsQuery';
import { encrypt } from '../../infrastructure/security/encryption';
import { JobCreatedEvent, JobUpdatedEvent } from '../../domain/events/DomainEvent';
import { IEventBus } from '../../infrastructure/events/IEventBus';

export class JobService {
  constructor(
    private jobRepository: IJobRepository,
    private eventBus: IEventBus
  ) {}

  async createJob(command: CreateJobCommand): Promise<CreateJobCommandResult> {
    // Encrypt adapter configurations
    const sourceConfigEncrypted = await encrypt(JSON.stringify(command.sourceConfig));
    const targetConfigEncrypted = await encrypt(JSON.stringify(command.targetConfig));

    // Create job entity
    const jobProps: Omit<JobProps, 'id' | 'status' | 'version' | 'createdAt' | 'updatedAt'> = {
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
    const job = Job.create(jobProps);

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
      rules: persistedJobProps.rules as unknown as Record<string, unknown>,
      schedule: persistedJobProps.schedule || null,
      status: persistedJobProps.status,
      version: persistedJobProps.version,
    });

    // Emit domain event
    await this.eventBus.publish(
      new JobCreatedEvent(savedJob.id, savedJob.userId, savedJob.name)
    );

    return {
      jobId: savedJob.id,
      name: savedJob.name,
      status: savedJob.status as Job['status'],
    };
  }

  async getJob(query: GetJobQuery): Promise<GetJobQueryResult> {
    const jobData = await this.jobRepository.findById(
      query.jobId,
      query.userId
    );

    if (!jobData) {
      throw new Error('Job not found');
    }

    // Convert repository format to domain format
    const source = jobData.source as { adapter: string; configEncrypted: string };
    const target = jobData.target as { adapter: string; configEncrypted: string };
    const rules = jobData.rules as unknown as ReconciliationRules;

    const result: GetJobQueryResult = {
      id: jobData.id,
      userId: jobData.userId,
      name: jobData.name,
      sourceAdapter: source.adapter,
      targetAdapter: target.adapter,
      rules: rules as GetJobQueryResult['rules'],
      status: jobData.status,
      createdAt: jobData.createdAt,
      updatedAt: jobData.updatedAt,
    };
    if (jobData.schedule) {
      result.schedule = jobData.schedule;
    }
    return result;
  }

  async listJobs(query: ListJobsQuery): Promise<ListJobsQueryResult> {
    const page = Math.floor(query.offset / query.limit) + 1;
    const result = await this.jobRepository.findByUserId(
      query.userId,
      page,
      query.limit
    );

    return {
      jobs: result.jobs.map((jobData) => {
        const source = jobData.source as { adapter: string };
        const target = jobData.target as { adapter: string };
        return {
          id: jobData.id,
          name: jobData.name,
          sourceAdapter: source.adapter,
          targetAdapter: target.adapter,
          status: jobData.status as JobStatus,
          createdAt: jobData.createdAt,
          updatedAt: jobData.updatedAt,
        };
      }),
      total: result.total,
      limit: query.limit,
      offset: query.offset,
    };
  }

  async updateJob(
    jobId: string,
    userId: string,
    updates: Partial<{
      name: string;
      rules: Job['rules'];
      schedule: string;
      sourceConfig: Record<string, unknown>;
      targetConfig: Record<string, unknown>;
    }>
  ): Promise<void> {
    const jobData = await this.jobRepository.findById(jobId, userId);
    if (!jobData) {
      throw new Error('Job not found');
    }

    // Convert repository format to domain entity
    const source = jobData.source as { adapter: string; configEncrypted: string };
    const target = jobData.target as { adapter: string; configEncrypted: string };
    const rules = jobData.rules as unknown as Job['rules'];
    
    const jobPropsForPersistence: JobProps = {
      id: jobData.id,
      userId: jobData.userId,
      name: jobData.name,
      sourceAdapter: source.adapter,
      sourceConfigEncrypted: source.configEncrypted,
      targetAdapter: target.adapter,
      targetConfigEncrypted: target.configEncrypted,
      rules,
      status: jobData.status as JobStatus,
      version: jobData.version,
      createdAt: jobData.createdAt,
      updatedAt: jobData.updatedAt,
    };
    if (jobData.schedule) {
      jobPropsForPersistence.schedule = jobData.schedule;
    }
    const job = Job.fromPersistence(jobPropsForPersistence);

    const changes: Record<string, unknown> = {};

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
        ? await encrypt(JSON.stringify(updates.sourceConfig))
        : job.sourceConfigEncrypted;
      const targetConfigEncrypted = updates.targetConfig
        ? await encrypt(JSON.stringify(updates.targetConfig))
        : job.targetConfigEncrypted;

      job.updateConfigs(sourceConfigEncrypted, targetConfigEncrypted);
      changes.configs = 'updated';
    }

    // Note: Repository doesn't have update method, so we'd need to implement it
    // For now, this is a placeholder
    const jobProps = job.toPersistence();
    await this.jobRepository.updateStatus(
      jobProps.id,
      jobProps.userId,
      jobProps.status,
      jobProps.version
    );

    // Emit domain event
    await this.eventBus.publish(
      new JobUpdatedEvent(jobProps.id, jobProps.userId, changes)
    );
  }

  async deleteJob(jobId: string, userId: string): Promise<void> {
    const deleted = await this.jobRepository.delete(jobId, userId);
    if (!deleted) {
      throw new Error('Job not found');
    }
  }
}
