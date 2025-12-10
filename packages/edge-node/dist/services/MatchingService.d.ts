/**
 * Matching Service
 * Performs local fuzzy matching and candidate scoring using optimized models
 */
import Database from "better-sqlite3";
import { ModelManager } from "./ModelManager";
export interface Candidate {
    sourceId: string;
    targetId: string;
    confidenceScore: number;
    scoreMatrix: Record<string, number>;
    features?: Record<string, unknown>;
}
export declare class MatchingService {
    private _db;
    private _modelManager;
    constructor(_db: Database.Database, _modelManager: ModelManager);
    findCandidates(sourceData: unknown[], targetData: unknown[]): Candidate[];
    private extractId;
    private calculateMatchScore;
    private compareAmount;
    private extractAmount;
    private compareDate;
    private extractDate;
    private compareString;
    private levenshteinDistance;
}
//# sourceMappingURL=MatchingService.d.ts.map