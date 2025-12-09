/**
 * Early Warning Signal Detection Service
 * Detects early signals that indicate a user might churn or need help
 */
export declare enum WarningSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high"
}
export interface WarningSignal {
    userId: string;
    signal: string;
    severity: WarningSeverity;
    detectedAt: Date;
    description: string;
    suggestedAction: string;
    metadata?: Record<string, unknown>;
}
/**
 * Detect early warning signals for a user
 */
export declare function detectEarlyWarningSignals(userId: string): Promise<WarningSignal[]>;
/**
 * Get all users with active warning signals
 */
export declare function getAllWarningSignals(severity?: WarningSeverity): Promise<WarningSignal[]>;
//# sourceMappingURL=early-warning.d.ts.map