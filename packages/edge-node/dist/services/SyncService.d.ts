/**
 * Sync Service
 * Handles synchronization of local data with Settler Cloud
 */
import { AxiosInstance } from "axios";
import Database from "better-sqlite3";
export declare class SyncService {
    private cloudApi;
    private db;
    private nodeKey;
    constructor(cloudApi: AxiosInstance, db: Database.Database, nodeKey: string);
    sync(): Promise<void>;
    private syncCandidates;
    private syncAnomalies;
    queueSync(entityType: string, payload: Record<string, unknown>): void;
    private processSyncQueue;
    flush(): Promise<void>;
}
//# sourceMappingURL=SyncService.d.ts.map