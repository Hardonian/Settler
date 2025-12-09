/**
 * Error Pattern Recognition Service
 * Automatically categorizes and summarizes error patterns
 */
export interface ErrorPattern {
    pattern: string;
    count: number;
    affectedUsers: number;
    firstSeen: Date;
    lastSeen: Date;
    suggestedFix: string;
    relatedErrors: string[];
    severity: "low" | "medium" | "high";
}
/**
 * Analyze error patterns
 */
export declare function analyzeErrorPatterns(timeWindow?: "hour" | "day" | "week"): Promise<ErrorPattern[]>;
//# sourceMappingURL=error-analyzer.d.ts.map