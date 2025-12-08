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
export class PaginatedIterator<T> implements AsyncIterableIterator<T> {
  private currentCursor?: string;
  private currentPage: T[] = [];
  private currentIndex = 0;
  private hasMore = true;

  constructor(
    private readonly fetchPage: (
      options: PaginationOptions
    ) => Promise<PaginatedResponse<T>>
  ) {}

  async next(): Promise<IteratorResult<T>> {
    // If we have items in the current page, return the next one
    if (this.currentIndex < this.currentPage.length) {
      const value = this.currentPage[this.currentIndex++];
      if (value !== undefined) {
        return { done: false, value };
      }
    }

    // If there are no more pages, we're done
    if (!this.hasMore) {
      return { done: true, value: undefined as T };
    }

    // Fetch the next page
    try {
      const options: PaginationOptions = {};
      if (this.currentCursor !== undefined) {
        options.cursor = this.currentCursor;
      }
      const response = await this.fetchPage(options);

      this.currentPage = response.data;
      this.currentIndex = 0;
      if (response.nextCursor !== undefined) {
        this.currentCursor = response.nextCursor;
      }
      this.hasMore = response.hasMore ?? response.nextCursor !== undefined;

      if (this.currentPage.length === 0) {
        return { done: true, value: undefined as T };
      }

      const value = this.currentPage[this.currentIndex++];
      if (value !== undefined) {
        return { done: false, value };
      }
      return { done: true, value: undefined as T };
    } catch (error) {
      throw error;
    }
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<T> {
    return this;
  }
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
export function createPaginatedIterator<T>(
  fetchPage: (options: PaginationOptions) => Promise<PaginatedResponse<T>>
): PaginatedIterator<T> {
  return new PaginatedIterator(fetchPage);
}

/**
 * Collects all items from a paginated iterator into an array
 * 
 * @example
 * ```typescript
 * const allJobs = await collectPaginated(iterator);
 * ```
 */
export async function collectPaginated<T>(
  iterator: AsyncIterableIterator<T>
): Promise<T[]> {
  const items: T[] = [];
  for await (const item of iterator) {
    items.push(item);
  }
  return items;
}
