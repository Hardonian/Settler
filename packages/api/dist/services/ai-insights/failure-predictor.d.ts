/**
 * Failure Prediction Service
 * Predicts when jobs/processes are likely to fail
 */
export interface FailurePrediction {
    jobId: string;
    willFail: boolean;
    confidence: number;
    reasons: string[];
    suggestions: string[];
}
/**
 * Predict if a job is likely to fail
 */
export declare function predictJobFailure(jobId: string): Promise<FailurePrediction | null>;
//# sourceMappingURL=failure-predictor.d.ts.map