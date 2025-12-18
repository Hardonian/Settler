/**
 * Ops Intelligence Recommendation Engine
 *
 * Rules-based action recommendations for insights.
 * Generates actionable, reversible recommendations.
 */
import { Insight } from './insights-engine';
export type ActionType = 'investigate' | 'upgrade' | 'throttle' | 'outreach' | 'document' | 'fix' | 'monitor' | 'verify' | 'retry';
export type RiskLevel = 'low' | 'med' | 'high';
export interface Recommendation {
    insightId?: string;
    actionType: ActionType;
    description: string;
    riskLevel: RiskLevel;
    expectedImpact: string;
    reversibility: boolean;
    runbookLink?: string;
}
/**
 * Generate recommendations for an insight
 * Note: insightId will be set when saving to database
 */
export declare function generateRecommendations(insight: Insight): Recommendation[];
//# sourceMappingURL=recommendation-engine.d.ts.map