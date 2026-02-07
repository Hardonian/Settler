/**
 * List Jobs Query
 * CQRS Query for listing jobs with pagination
 */

export interface ListJobsQuery {
  userId: string;
  tenantId: string;
  limit: number;
  offset: number;
  status?: string;
}

export interface ListJobsQueryResult {
  jobs: Array<{
    id: string;
    name: string;
    sourceAdapter: string;
    targetAdapter: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  total: number;
  limit: number;
  offset: number;
}
