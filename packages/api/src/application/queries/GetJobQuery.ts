/**
 * Get Job Query
 * CQRS Query for retrieving a job by ID
 */

export interface GetJobQuery {
  jobId: string;
  userId: string;
  tenantId: string;
}

export interface GetJobQueryResult {
  id: string;
  userId: string;
  name: string;
  sourceAdapter: string;
  targetAdapter: string;
  rules: {
    matching: Array<{
      field: string;
      type: string;
      tolerance?: number;
      threshold?: number;
      days?: number;
    }>;
    conflictResolution: string;
  };
  schedule?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
