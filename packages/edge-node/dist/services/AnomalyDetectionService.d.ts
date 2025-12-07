/**
 * Anomaly Detection Service
 * Detects anomalies in transaction data using ML models
 */
import Database from "better-sqlite3";
import { ModelManager } from "./ModelManager";
export interface Anomaly {
    type: string;
    severity: "low" | "medium" | "high" | "critical";
    transactionData: Record<string, unknown>;
    score?: number;
}
export declare class AnomalyDetectionService {
    private db;
    private _modelManager;
    constructor(db: Database.Database, _modelManager: ModelManager);
    detect(data: unknown[]): Promise<Anomaly[]>;
    private checkDuplicate;
    private checkAmountAnomaly;
    private checkMissingFields;
    private checkPatternDeviation;
    private extractAmount;
    private extractDate;
}
//# sourceMappingURL=AnomalyDetectionService.d.ts.map