/**
 * Predictive Routing Engine
 *
 * Dynamically selects optimal paths for operations
 * Part of Section 6: Multi-Agent Evolution Layer
 */
import { AIModel } from '../ai-mesh/ai-router';
export interface RoutingDecision {
    path: 'deterministic' | 'ai' | 'hybrid';
    model?: AIModel;
    estimatedCost: number;
    estimatedLatency: number;
    confidence: number;
    reasoning: string;
}
export declare class PredictiveRouter {
    private router;
    private historicalData;
    constructor();
    /**
     * Route operation to optimal path
     */
    route(operationType: string, complexity: 'low' | 'medium' | 'high', accuracyRequired: number, budget?: number): Promise<RoutingDecision>;
    /**
     * Record operation result for learning
     */
    recordResult(operationType: string, path: 'deterministic' | 'ai' | 'hybrid', success: boolean, cost: number, latency: number): void;
    /**
     * Get optimal fallback strategy
     */
    getFallbackStrategy(primaryPath: RoutingDecision): RoutingDecision[];
}
//# sourceMappingURL=predictive-router.d.ts.map