/**
 * Drop-Off Step Analysis Service
 * Identifies exact steps where users abandon onboarding or workflows
 */
export interface DropOffStep {
    step: string;
    completionRate: number;
    dropOffRate: number;
    avgTimeSpent: number;
    totalUsers: number;
    completedUsers: number;
    droppedUsers: number;
}
export interface DropOffAnalysis {
    funnel: "onboarding" | "reconciliation" | "export";
    steps: DropOffStep[];
    overallCompletionRate: number;
    biggestDropOff: DropOffStep | null;
    suggestions: string[];
}
/**
 * Analyze drop-off steps for a specific funnel
 */
export declare function analyzeDropOffSteps(funnel: "onboarding" | "reconciliation" | "export", days?: number): Promise<DropOffAnalysis>;
//# sourceMappingURL=dropoff-analyzer.d.ts.map