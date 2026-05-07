export interface OptimizationOpportunity {
  id: string;
  type: "query" | "cost" | "performance" | "capacity";
  description: string;
  currentState: Record<string, unknown>;
  proposedChange: Record<string, unknown>;
  expectedImpact: {
    costSavings?: number;
    performanceImprovement?: number;
    errorRateReduction?: number;
    memoryReduction?: number;
    throughputIncrease?: number;
    loadReduction?: number;
    riskLevel: "low" | "medium" | "high";
  };
  recommendedAction: "auto-apply" | "human-review";
}
