/**
 * Job Repository Implementation
 * PostgreSQL implementation of IJobRepository
 */
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
export declare class JobRepository implements IJobRepository {
    findById(id: string, userId: string): Promise<Job | null>;
    findByUserId(userId: string, page: number, limit: number): Promise<{
        jobs: Job[];
        total: number;
    }>;
    create(job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<Job>;
    updateStatus(id: string, userId: string, status: string, expectedVersion: number): Promise<Job | null>;
    delete(id: string, userId: string): Promise<boolean>;
}
//# sourceMappingURL=JobRepository.d.ts.map