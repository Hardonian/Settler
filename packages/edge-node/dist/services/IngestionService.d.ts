/**
 * Ingestion Service
 * Handles local data ingestion, schema inference, and PII detection
 */
import Database from "better-sqlite3";
import { PIIRedactionService } from "./PIIRedactionService";
export interface InferredSchema {
    fields: Array<{
        name: string;
        type: "string" | "number" | "date" | "boolean" | "unknown";
        piiType?: string;
    }>;
}
export interface IngestionResult {
    processedData: unknown[];
    inferredSchema: InferredSchema;
    piiDetected: boolean;
}
export declare class IngestionService {
    private _db;
    private piiRedaction;
    constructor(_db: Database.Database, piiRedaction: PIIRedactionService);
    process(data: unknown[], schemaHints?: Record<string, string>): IngestionResult;
    private inferSchema;
    private inferType;
    private detectPII;
}
//# sourceMappingURL=IngestionService.d.ts.map