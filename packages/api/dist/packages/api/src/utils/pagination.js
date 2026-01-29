"use strict";
/**
 * Pagination Utilities
 * Cursor-based pagination for better performance at scale
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeCursor = decodeCursor;
exports.encodeCursor = encodeCursor;
exports.buildCursorWhereClause = buildCursorWhereClause;
exports.buildCursorOrderBy = buildCursorOrderBy;
exports.createCursorPaginationResponse = createCursorPaginationResponse;
exports.parseCursorPaginationParams = parseCursorPaginationParams;
/**
 * Decodes a base64-encoded cursor string into pagination parameters.
 *
 * @param cursor - Base64-encoded cursor string from previous pagination response
 * @returns Decoded cursor object with `created_at` and `id`, or `null` if invalid
 *
 * @example
 * ```typescript
 * const cursor = decodeCursor("eyJjcmVhdGVkX2F0IjoiMjAyNC0wMS0wMSIsImlkIjoiMTIzIn0=");
 * // Returns: { created_at: "2024-01-01", id: "123" }
 * ```
 */
function decodeCursor(cursor) {
    try {
        const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
        return JSON.parse(decoded);
    }
    catch {
        return null;
    }
}
/**
 * Encodes pagination parameters into a base64-encoded cursor string.
 *
 * @param created_at - Creation timestamp (ISO string or Date)
 * @param id - Item ID
 * @returns Base64-encoded cursor string
 *
 * @example
 * ```typescript
 * const cursor = encodeCursor(new Date(), "123");
 * // Returns: "eyJjcmVhdGVkX2F0IjoiMjAyNC0wMS0wMSIsImlkIjoiMTIzIn0="
 * ```
 */
function encodeCursor(created_at, id) {
    const cursor = {
        created_at: created_at instanceof Date ? created_at.toISOString() : created_at,
        id,
    };
    return Buffer.from(JSON.stringify(cursor)).toString('base64');
}
/**
 * Build cursor-based WHERE clause for SQL
 */
function buildCursorWhereClause(params, tableAlias = '') {
    const prefix = tableAlias ? `${tableAlias}.` : '';
    // Limit is reserved for future query building
    const _limit = Math.min(params.limit || 100, 1000);
    void _limit;
    const direction = params.direction || 'next';
    let paramIndex = 1;
    const queryParams = [];
    let whereClause = '';
    if (params.cursor) {
        const decoded = decodeCursor(params.cursor);
        if (decoded) {
            if (direction === 'next') {
                // Get items after cursor
                whereClause = `WHERE (${prefix}created_at, ${prefix}id) < ($${paramIndex}, $${paramIndex + 1})`;
                queryParams.push(decoded.created_at, decoded.id);
                paramIndex += 2;
            }
            else {
                // Get items before cursor
                whereClause = `WHERE (${prefix}created_at, ${prefix}id) > ($${paramIndex}, $${paramIndex + 1})`;
                queryParams.push(decoded.created_at, decoded.id);
                paramIndex += 2;
            }
        }
    }
    return {
        whereClause,
        params: queryParams,
        paramIndex,
    };
}
/**
 * Build cursor-based ORDER BY clause
 */
function buildCursorOrderBy(direction = 'next', tableAlias = '') {
    const prefix = tableAlias ? `${tableAlias}.` : '';
    if (direction === 'next') {
        return `ORDER BY ${prefix}created_at DESC, ${prefix}id DESC`;
    }
    else {
        return `ORDER BY ${prefix}created_at ASC, ${prefix}id ASC`;
    }
}
/**
 * Generate pagination response with cursors
 */
function createCursorPaginationResponse(items, limit, direction = 'next') {
    const hasMore = items.length > limit;
    const paginatedItems = hasMore ? items.slice(0, limit) : items;
    let nextCursor;
    let prevCursor;
    if (paginatedItems.length > 0) {
        const firstItem = paginatedItems[0];
        const lastItem = paginatedItems[paginatedItems.length - 1];
        if (direction === 'next') {
            // For next page, use last item as cursor
            if (hasMore && lastItem) {
                nextCursor = encodeCursor(lastItem.created_at, lastItem.id);
            }
            // For previous page, use first item as cursor (reversed)
            if (firstItem) {
                prevCursor = encodeCursor(firstItem.created_at, firstItem.id);
            }
        }
        else {
            // For prev page, use first item as cursor
            if (hasMore && firstItem) {
                prevCursor = encodeCursor(firstItem.created_at, firstItem.id);
            }
            // For next page, use last item as cursor (reversed)
            if (lastItem) {
                nextCursor = encodeCursor(lastItem.created_at, lastItem.id);
            }
        }
    }
    const result = {
        items: paginatedItems,
        hasMore,
    };
    if (nextCursor) {
        result.nextCursor = nextCursor;
    }
    if (prevCursor) {
        result.prevCursor = prevCursor;
    }
    return result;
}
/**
 * Parse pagination params from query string
 */
function parseCursorPaginationParams(req) {
    const result = {};
    if (req.query.cursor) {
        result.cursor = req.query.cursor;
    }
    if (req.query.limit) {
        result.limit = parseInt(req.query.limit, 10);
    }
    result.direction = req.query.direction || 'next';
    return result;
}
//# sourceMappingURL=pagination.js.map