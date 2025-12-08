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
   * Find job by ID and user ID
   * @param id - Job ID
   * @param userId - User ID (for tenant isolation)
   * @returns Job or null if not found
   */
  findById(id: string, userId: string): Promise<Job | null>;

  /**
   * Find all jobs for a user with pagination
   * @param userId - User ID
   * @param page - Page number (1-indexed)
   * @param limit - Items per page
   * @returns Jobs and total count
   */
  findByUserId(userId: string, page: number, limit: number): Promise<{ jobs: Job[]; total: number }>;

  /**
   * Create a new job
   * @param job - Job entity to create
   * @returns Created job with ID
   */
  create(job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<Job>;

  /**
   * Update job status atomically with optimistic locking
   * @param id - Job ID
   * @param userId - User ID
   * @param status - New status
   * @param expectedVersion - Expected version for optimistic locking
   * @returns Updated job or null if version mismatch
   */
  updateStatus(id: string, userId: string, status: string, expectedVersion: number): Promise<Job | null>;

  /**
   * Delete job by ID
   * @param id - Job ID
   * @param userId - User ID
   * @returns True if deleted, false if not found
   */
  delete(id: string, userId: string): Promise<boolean>;
}
