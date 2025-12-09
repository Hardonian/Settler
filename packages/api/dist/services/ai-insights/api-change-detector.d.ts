/**
 * API Change Detection Service
 * Detects when routes change and flags documentation updates needed
 */
import { RouteDoc } from "./doc-generator";
export interface APIChange {
    type: "added" | "modified" | "removed";
    route: string;
    method: string;
    changes: string[];
    docsNeeded: boolean;
    file?: string;
}
export interface ChangeReport {
    detectedAt: Date;
    changes: APIChange[];
    totalAdded: number;
    totalModified: number;
    totalRemoved: number;
    documentationNeeded: number;
}
/**
 * Detect API changes by comparing current routes with last known state
 * This is a simplified version - in production, you'd store last state in DB/file
 */
export declare function detectAPIChanges(lastKnownRoutes?: RouteDoc[]): Promise<ChangeReport>;
/**
 * Generate a summary report of API changes
 */
export declare function generateChangeReport(report: ChangeReport): Promise<string>;
/**
 * Save change report to file
 */
export declare function saveChangeReport(outputPath: string, report: ChangeReport): Promise<void>;
//# sourceMappingURL=api-change-detector.d.ts.map