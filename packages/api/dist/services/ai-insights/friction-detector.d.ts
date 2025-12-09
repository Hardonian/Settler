/**
 * Friction Point Detection Service
 * Identifies where users struggle (errors, slow operations, retries)
 */
export interface FrictionPoint {
    endpoint: string;
    issue: string;
    frequency: number;
    affectedUsers: number;
    severity: "low" | "medium" | "high";
    suggestedFix: string;
    firstSeen: Date;
    lastSeen: Date;
}
export interface FrictionAnalysis {
    timeWindow: "day" | "week" | "month";
    frictionPoints: FrictionPoint[];
    totalIssues: number;
    topIssue: FrictionPoint | null;
    summary: string;
}
/**
 * Identify friction points in the system
 */
export declare function identifyFrictionPoints(timeWindow?: "day" | "week" | "month"): Promise<FrictionAnalysis>;
/**
 * Get friction points for a specific endpoint
 */
export declare function getEndpointFriction(endpoint: string, days?: number): Promise<FrictionPoint[]>;
//# sourceMappingURL=friction-detector.d.ts.map