# JSDoc Examples for Settler API

## Function Documentation

````typescript
/**
 * Creates a new reconciliation job
 *
 * @param userId - The ID of the user creating the job
 * @param request - Job creation request with source, target, and rules
 * @returns Promise resolving to the created job response
 * @throws {ValidationError} When request validation fails
 * @throws {InternalServerError} When job creation fails
 *
 * @example
 * ```typescript
 * const job = await jobService.createJob(userId, {
 *   name: "Shopify-Stripe Reconciliation",
 *   source: { adapter: "shopify", config: { apiKey: "..." } },
 *   target: { adapter: "stripe", config: { apiKey: "..." } },
 *   rules: { matching: [{ field: "order_id", type: "exact" }] }
 * });
 * ```
 */
async createJob(userId: string, request: CreateJobRequest): Promise<JobResponse>
````

## Class Documentation

````typescript
/**
 * Service for managing reconciliation jobs
 *
 * Handles creation, retrieval, listing, and deletion of reconciliation jobs.
 * All operations are tenant-scoped and enforce proper authorization.
 *
 * @example
 * ```typescript
 * const jobService = new JobRouteService();
 * const job = await jobService.createJob(userId, request);
 * ```
 */
export class JobRouteService {
  // ...
}
````

## Type Documentation

```typescript
/**
 * Configuration for creating a reconciliation job
 *
 * @property name - Human-readable name for the job
 * @property source - Source adapter configuration
 * @property target - Target adapter configuration
 * @property rules - Matching rules and conflict resolution strategy
 * @property schedule - Optional cron expression for scheduled runs
 */
export interface CreateJobRequest {
  // ...
}
```
