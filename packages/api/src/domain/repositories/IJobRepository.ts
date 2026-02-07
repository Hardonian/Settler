/**
 * Job Repository Interface
 * Defines data access contract for Job entities
 *
 * INVARIANT: All methods require tenantId to enforce tenant isolation.
 * userId alone is NOT sufficient — tenantId is the isolation boundary.
 */

export interface Job {
  id: string;
  userId: string;
  tenantId: string;
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
   * Find job by ID scoped to tenant
   * @param id - Job ID
   * @param userId - User ID
   * @param tenantId - Tenant ID (isolation boundary)
   * @returns Job or null if not found
   */
  findById(id: string, userId: string, tenantId: string): Promise<Job | null>;

  /**
   * Find all jobs for a user within a tenant
   * @param userId - User ID
   * @param tenantId - Tenant ID (isolation boundary)
   * @param page - Page number (1-indexed)
   * @param limit - Items per page
   * @returns Jobs and total count
   */
  findByUserId(
    userId: string,
    tenantId: string,
    page: number,
    limit: number
  ): Promise<{ jobs: Job[]; total: number }>;

  /**
   * Create a new job within a tenant
   * @param job - Job entity to create (must include tenantId)
   * @returns Created job with ID
   */
  create(job: Omit<Job, "id" | "createdAt" | "updatedAt">): Promise<Job>;

  /**
   * Update job status atomically with optimistic locking
   * @param id - Job ID
   * @param userId - User ID
   * @param tenantId - Tenant ID (isolation boundary)
   * @param status - New status
   * @param expectedVersion - Expected version for optimistic locking
   * @returns Updated job or null if version mismatch
   */
  updateStatus(
    id: string,
    userId: string,
    tenantId: string,
    status: string,
    expectedVersion: number
  ): Promise<Job | null>;

  /**
   * Delete job by ID within a tenant
   * @param id - Job ID
   * @param userId - User ID
   * @param tenantId - Tenant ID (isolation boundary)
   * @returns True if deleted, false if not found
   */
  delete(id: string, userId: string, tenantId: string): Promise<boolean>;
}
