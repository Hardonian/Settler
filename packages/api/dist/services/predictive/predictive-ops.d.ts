/**
 * Predictive Operations
 *
 * Predict failures before they occur
 * Part 9: Predictive Ops, Meta-Models & Next-Gen Pipelines
 */
import { PrismaClient } from '@prisma/client';
export interface FailurePrediction {
    type: 'drift' | 'mapping' | 'template' | 'transformation' | 'cost';
    severity: 'low' | 'medium' | 'high' | 'critical';
    probability: number;
    timeframe: string;
    description: string;
    recommendedActions: string[];
}
export declare class PredictiveOps {
    private prisma;
    private _predictions;
    constructor(prisma: PrismaClient);
    /**
     * Run predictive analysis
     */
    predictFailures(): Promise<FailurePrediction[]>;
    /**
     * Predict historical drift
     */
    private predictDrift;
    /**
     * Predict mapping volatility
     */
    private predictMappingVolatility;
    /**
     * Predict template issues
     */
    private predictTemplateIssues;
    /**
     * Predict transformation failures
     */
    private predictTransformFailures;
    /**
     * Predict cost spikes
     */
    private predictCostSpikes;
    /**
     * Take preemptive actions based on predictions
     */
    takePreemptiveActions(predictions: FailurePrediction[]): Promise<void>;
}
//# sourceMappingURL=predictive-ops.d.ts.map