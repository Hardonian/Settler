/**
 * Infrastructure Optimizer Agent
 *
 * Automatically optimizes Settler's infrastructure:
 * - Query optimization
 * - Cost reduction
 * - Performance tuning
 * - Capacity planning
 */
import { BaseAgent } from './orchestrator';
export interface OptimizationOpportunity {
    id: string;
    type: 'query' | 'cost' | 'performance' | 'capacity';
    description: string;
    currentState: Record<string, unknown>;
    proposedChange: Record<string, unknown>;
    expectedImpact: {
        costSavings?: number;
        performanceImprovement?: number;
        riskLevel: 'low' | 'medium' | 'high';
    };
    recommendedAction: 'auto-apply' | 'human-review';
}
export declare class InfrastructureOptimizerAgent extends BaseAgent {
    id: string;
    name: string;
    type: "infrastructure";
    private lastOptimization?;
    private optimizationHistory;
    initialize(): Promise<void>;
    execute(action: string, params: Record<string, unknown>): Promise<unknown>;
    getStatus(): Promise<{
        enabled: boolean;
        lastExecution?: Date;
        metrics?: Record<string, unknown>;
    }>;
    /**
     * Analyze infrastructure for optimization opportunities
     */
    private analyzeInfrastructure;
    /**
     * Find slow queries
     */
    private findSlowQueries;
    /**
     * Find cost optimization opportunities
     */
    private findCostOptimizations;
    /**
     * Find performance issues
     */
    private findPerformanceIssues;
    /**
     * Find capacity issues
     */
    private findCapacityIssues;
    /**
     * Apply an optimization
     */
    private applyOptimization;
    /**
     * Optimize infrastructure based on params
     */
    private optimizeInfrastructure;
}
//# sourceMappingURL=infrastructure-optimizer.d.ts.map