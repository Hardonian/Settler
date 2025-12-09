/**
 * Pagination Utilities
 * Cursor-based pagination for better performance at scale
 */
export interface CursorPaginationParams {
    cursor?: string;
    limit?: number;
    direction?: 'next' | 'prev';
}
export interface CursorPaginationResult<T> {
    items: T[];
    nextCursor?: string;
    prevCursor?: string;
    hasMore: boolean;
}
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
export declare function decodeCursor(cursor: string): {
    created_at: string;
    id: string;
} | null;
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
export declare function encodeCursor(created_at: string | Date, id: string): string;
/**
 * Build cursor-based WHERE clause for SQL
 */
export declare function buildCursorWhereClause(params: CursorPaginationParams, tableAlias?: string): {
    whereClause: string;
    params: (string | number)[];
    paramIndex: number;
};
/**
 * Build cursor-based ORDER BY clause
 */
export declare function buildCursorOrderBy(direction?: 'next' | 'prev', tableAlias?: string): string;
/**
 * Generate pagination response with cursors
 */
export declare function createCursorPaginationResponse<T extends {
    created_at: Date | string;
    id: string;
}>(items: T[], limit: number, direction?: 'next' | 'prev'): CursorPaginationResult<T>;
/**
 * Parse pagination params from query string
 */
export declare function parseCursorPaginationParams(req: {
    query: Record<string, string | undefined>;
}): CursorPaginationParams;
//# sourceMappingURL=pagination.d.ts.map