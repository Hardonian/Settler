/**
 * Insight Aggregation Service
 * Aggregates all AI-generated insights into actionable reports
 */
import { DropOffAnalysis } from "./dropoff-analyzer";
import { FrictionAnalysis } from "./friction-detector";
import { ErrorPattern } from "./error-analyzer";
import { FeatureDependency } from "./pattern-detector";
import { WarningSignal } from "./early-warning";
export interface InsightReport {
    period: "day" | "week" | "month";
    generatedAt: Date;
    summary: string;
    topIssues: Array<{
        type: string;
        description: string;
        severity: "low" | "medium" | "high";
        count?: number;
    }>;
    recommendations: string[];
    trends: {
        dropOff: DropOffAnalysis | null;
        friction: FrictionAnalysis | null;
        errors: ErrorPattern[];
        warnings: WarningSignal[];
        dependencies: FeatureDependency[];
    };
}
/**
 * Aggregate insights from all AI services
 */
export declare function aggregateInsights(period?: "day" | "week" | "month"): Promise<InsightReport>;
//# sourceMappingURL=insight-aggregator.d.ts.map