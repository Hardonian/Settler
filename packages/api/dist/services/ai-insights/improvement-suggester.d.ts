/**
 * Improvement Suggestion Engine
 * Automatically suggests product improvements based on insights
 */
export interface ImprovementSuggestion {
    type: "feature" | "ux" | "performance" | "documentation" | "bug_fix";
    priority: "low" | "medium" | "high";
    description: string;
    impact: "low" | "medium" | "high";
    effort: "low" | "medium" | "high";
    relatedIssues: string[];
    estimatedImpact?: string;
}
/**
 * Generate improvement suggestions based on insights
 */
export declare function suggestImprovements(): Promise<ImprovementSuggestion[]>;
/**
 * Save improvement suggestions to database
 */
export declare function saveImprovementSuggestions(suggestions: ImprovementSuggestion[]): Promise<void>;
//# sourceMappingURL=improvement-suggester.d.ts.map