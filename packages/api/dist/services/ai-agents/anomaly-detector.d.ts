/**
 * Anomaly & Exploit Detector Agent
 *
 * Detects anomalies in reconciliation data, API usage patterns, and security threats.
 */
import { BaseAgent } from './orchestrator';
export interface Anomaly {
    id: string;
    type: 'reconciliation' | 'security' | 'data_quality' | 'business_logic';
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    detectedAt: Date;
    evidence: Record<string, unknown>;
    confidence: number;
    recommendedAction: string;
}
export declare class AnomalyDetectorAgent extends BaseAgent {
    id: string;
    name: string;
    type: "anomaly";
    private detectedAnomalies;
    private lastDetection?;
    private _detectionRules;
    initialize(): Promise<void>;
    execute(action: string, params: Record<string, unknown>): Promise<unknown>;
    getStatus(): Promise<{
        enabled: boolean;
        lastExecution?: Date;
        metrics?: Record<string, unknown>;
    }>;
    /**
     * Detect anomalies
     */
    private detectAnomalies;
    /**
     * Detect reconciliation anomalies
     */
    private detectReconciliationAnomalies;
    /**
     * Detect security threats
     */
    private detectSecurityThreats;
    /**
     * Detect data quality issues
     */
    private detectDataQualityIssues;
    /**
     * Detect business logic anomalies
     */
    private detectBusinessLogicAnomalies;
    /**
     * Load detection rules
     */
    private loadDetectionRules;
    /**
     * Send alert for anomaly
     */
    private sendAlert;
}
//# sourceMappingURL=anomaly-detector.d.ts.map