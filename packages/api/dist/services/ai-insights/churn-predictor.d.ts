/**
 * Churn Prediction Service
 * Predicts user churn using heuristic signals
 */
export interface ChurnPrediction {
    userId: string;
    riskLevel: "low" | "medium" | "high";
    score: number;
    signals: string[];
    interventions: string[];
}
/**
 * Predict churn for a user
 */
export declare function predictChurn(userId: string): Promise<ChurnPrediction | null>;
//# sourceMappingURL=churn-predictor.d.ts.map