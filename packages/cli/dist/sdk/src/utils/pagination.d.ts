/**
 * Pagination utilities for async iteration over paginated API responses
 */
export interface PaginatedResponse<T> {
    data: T[];
    count: number;
    nextCursor?: string;
    hasMore?: boolean;
}
export interface PaginationOptions {
    /** Maximum number of items per page */
    limit?: number;
    /** Cursor for pagination */
    cursor?: string;
}
/**
 * Async iterator for paginated API responses
 */
export declare class PaginatedIterator<T> implements AsyncIterableIterator<T> {
    private readonly fetchPage;
    private currentCursor?;
    private currentPage;
    private currentIndex;
    private hasMore;
    constructor(fetchPage: (options: PaginationOptions) => Promise<PaginatedResponse<T>>);
    next(): Promise<IteratorResult<T>>;
    [Symbol.asyncIterator](): AsyncIterableIterator<T>;
}
/**
 * Creates an async iterator for paginated API responses
 *
 * @example
 * ```typescript
 * const iterator = createPaginatedIterator((options) =>
 *   client.jobs.list({ cursor: options.cursor })
 * );
 *
 * for await (const job of iterator) {
 *   console.log(job);
 * }
 * ```
 */
export declare function createPaginatedIterator<T>(fetchPage: (options: PaginationOptions) => Promise<PaginatedResponse<T>>): PaginatedIterator<T>;
/**
 * Collects all items from a paginated iterator into an array
 *
 * @example
 * ```typescript
 * const allJobs = await collectPaginated(iterator);
 * ```
 */
export declare function collectPaginated<T>(iterator: AsyncIterableIterator<T>): Promise<T[]>;
//# sourceMappingURL=pagination.d.ts.map