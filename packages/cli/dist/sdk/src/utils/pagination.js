"use strict";
/**
 * Pagination utilities for async iteration over paginated API responses
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginatedIterator = void 0;
exports.createPaginatedIterator = createPaginatedIterator;
exports.collectPaginated = collectPaginated;
/**
 * Async iterator for paginated API responses
 */
class PaginatedIterator {
    fetchPage;
    currentCursor;
    currentPage = [];
    currentIndex = 0;
    hasMore = true;
    constructor(fetchPage) {
        this.fetchPage = fetchPage;
    }
    async next() {
        // If we have items in the current page, return the next one
        if (this.currentIndex < this.currentPage.length) {
            const value = this.currentPage[this.currentIndex++];
            if (value !== undefined) {
                return { done: false, value };
            }
        }
        // If there are no more pages, we're done
        if (!this.hasMore) {
            return { done: true, value: undefined };
        }
        // Fetch the next page
        const options = {};
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
            return { done: true, value: undefined };
        }
        const value = this.currentPage[this.currentIndex++];
        if (value !== undefined) {
            return { done: false, value };
        }
        return { done: true, value: undefined };
    }
    [Symbol.asyncIterator]() {
        return this;
    }
}
exports.PaginatedIterator = PaginatedIterator;
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
function createPaginatedIterator(fetchPage) {
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
async function collectPaginated(iterator) {
    const items = [];
    for await (const item of iterator) {
        items.push(item);
    }
    return items;
}
//# sourceMappingURL=pagination.js.map