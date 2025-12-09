/**
 * Job Service
 * Application service for reconciliation job operations
 */
import { Job } from '../../domain/entities/Job';
import { IJobRepository } from '../../domain/repositories/IJobRepository';
import { CreateJobCommand, CreateJobCommandResult } from '../commands/CreateJobCommand';
import { GetJobQuery, GetJobQueryResult } from '../queries/GetJobQuery';
import { ListJobsQuery, ListJobsQueryResult } from '../queries/ListJobsQuery';
import { IEventBus } from '../../infrastructure/events/IEventBus';
export declare class JobService {
    private jobRepository;
    private eventBus;
    constructor(jobRepository: IJobRepository, eventBus: IEventBus);
    createJob(command: CreateJobCommand): Promise<CreateJobCommandResult>;
    getJob(query: GetJobQuery): Promise<GetJobQueryResult>;
    listJobs(query: ListJobsQuery): Promise<ListJobsQueryResult>;
    updateJob(jobId: string, userId: string, updates: Partial<{
        name: string;
        rules: Job['rules'];
        schedule: string;
        sourceConfig: Record<string, unknown>;
        targetConfig: Record<string, unknown>;
    }>): Promise<void>;
    deleteJob(jobId: string, userId: string): Promise<void>;
}
//# sourceMappingURL=JobService.d.ts.map