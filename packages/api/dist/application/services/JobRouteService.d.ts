/**
 * Job Route Service
 * Business logic for job-related routes
 * Extracted from route handlers for better testability and maintainability
 */
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
    source: {
        adapter: string;
        config?: Record<string, unknown>;
    };
    target: {
        adapter: string;
        config?: Record<string, unknown>;
    };
    rules: CreateJobRequest['rules'];
    schedule?: string;
    status: string;
    createdAt: string;
}
export declare class JobRouteService {
    /**
     * Create a new reconciliation job
     */
    createJob(userId: string, request: CreateJobRequest): Promise<JobResponse>;
    /**
     * Get job by ID
     */
    getJob(jobId: string, userId: string): Promise<JobResponse | null>;
    /**
     * List jobs with pagination
     */
    listJobs(userId: string, page?: number, limit?: number): Promise<{
        jobs: JobResponse[];
        total: number;
    }>;
    /**
     * Delete a job
     */
    deleteJob(jobId: string, userId: string): Promise<boolean>;
}
//# sourceMappingURL=JobRouteService.d.ts.map