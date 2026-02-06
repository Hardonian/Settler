/**
 * Job Repository Interface
 * Defines data access contract for Job entities
 */

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

export interface IJobRepository {
  /**
   * Find job by ID, scoped to tenant and user
   * @param id - Job ID
   * @param tenantId - Tenant ID (required for isolation)
   * @param userId - User ID
   * @returns Job or null if not found
   */
  findById(id: string, tenantId: string, userId: string): Promise<Job | null>;

  /**
   * Find all jobs for a user within a tenant with pagination
   * @param tenantId - Tenant ID (required for isolation)
   * @param userId - User ID
   * @param page - Page number (1-indexed)
   * @param limit - Items per page
   * @returns Jobs and total count
   */
  findByUserId(
    tenantId: string,
    userId: string,
    page: number,
    limit: number
  ): Promise<{ jobs: Job[]; total: number }>;

  /**
   * Create a new job within a tenant
   * @param tenantId - Tenant ID (required for isolation)
   * @param job - Job entity to create
   * @returns Created job with ID
   */
  create(tenantId: string, job: Omit<Job, "id" | "createdAt" | "updatedAt">): Promise<Job>;

  /**
   * Update job status atomically with optimistic locking
   * @param id - Job ID
   * @param tenantId - Tenant ID (required for isolation)
   * @param userId - User ID
   * @param status - New status
   * @param expectedVersion - Expected version for optimistic locking
   * @returns Updated job or null if version mismatch
   */
  updateStatus(
    id: string,
    tenantId: string,
    userId: string,
    status: string,
    expectedVersion: number
  ): Promise<Job | null>;

  /**
   * Delete job by ID within a tenant
   * @param id - Job ID
   * @param tenantId - Tenant ID (required for isolation)
   * @param userId - User ID
   * @returns True if deleted, false if not found
   */
  delete(id: string, tenantId: string, userId: string): Promise<boolean>;
}
