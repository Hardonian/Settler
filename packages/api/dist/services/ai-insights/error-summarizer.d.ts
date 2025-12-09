/**
 * Error Summary Generator
 * Generates human-readable error summaries for support
 */
export interface ErrorSummary {
    errorId: string;
    summary: string;
    rootCause: string;
    affected: {
        users: number;
        count: number;
    };
    timeline: Array<{
        time: Date;
        event: string;
    }>;
    suggestedFix: string;
    similarErrors: number;
}
/**
 * Summarize an error for support
 */
export declare function summarizeError(errorId: string, traceId?: string): Promise<ErrorSummary | null>;
//# sourceMappingURL=error-summarizer.d.ts.map