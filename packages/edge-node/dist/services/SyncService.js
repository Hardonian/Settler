"use strict";
/**
 * Sync Service
 * Handles synchronization of local data with Settler Cloud
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncService = void 0;
const logger_1 = require("../utils/logger");
const config_1 = require("../config");
class SyncService {
    cloudApi;
    db;
    nodeKey;
    constructor(cloudApi, db, nodeKey) {
        this.cloudApi = cloudApi;
        this.db = db;
        this.nodeKey = nodeKey;
    }
    async sync() {
        if (config_1.config.enableOfflineMode) {
            logger_1.logger.debug("Offline mode enabled, skipping sync");
            return;
        }
        try {
            // Sync candidates
            await this.syncCandidates();
            // Sync anomalies
            await this.syncAnomalies();
            // Process sync queue
            await this.processSyncQueue();
        }
        catch (error) {
            logger_1.logger.error("Sync failed", error);
            throw error;
        }
    }
    async syncCandidates() {
        const unsynced = this.db
            .prepare(`
      SELECT * FROM local_candidates 
      WHERE synced = 0 
      LIMIT ?
    `)
            .all(config_1.config.batchSize);
        if (unsynced.length === 0) {
            return;
        }
        try {
            const candidates = unsynced.map((c) => ({
                source_id: c.source_id,
                target_id: c.target_id,
                confidence_score: c.confidence_score,
                score_matrix: JSON.parse(c.score_matrix || "{}"),
            }));
            await this.cloudApi.post("/api/edge-ai/candidate-scores", {
                node_key: this.nodeKey,
                candidates,
            });
            // Mark as synced
            const updateStmt = this.db.prepare(`
        UPDATE local_candidates 
        SET synced = 1 
        WHERE id = ?
      `);
            for (const candidate of unsynced) {
                updateStmt.run(candidate.id);
            }
            logger_1.logger.info("Candidates synced", { count: unsynced.length });
        }
        catch (error) {
            logger_1.logger.error("Failed to sync candidates", error);
            throw error;
        }
    }
    async syncAnomalies() {
        const unsynced = this.db
            .prepare(`
      SELECT * FROM local_anomalies 
      WHERE synced = 0 
      LIMIT ?
    `)
            .all(config_1.config.batchSize);
        if (unsynced.length === 0) {
            return;
        }
        try {
            const anomalies = unsynced.map((a) => ({
                anomaly_type: a.anomaly_type,
                severity: a.severity,
                transaction_data: JSON.parse(a.transaction_data || "{}"),
            }));
            await this.cloudApi.post("/api/edge-ai/anomalies", {
                node_key: this.nodeKey,
                anomalies,
            });
            // Mark as synced
            const updateStmt = this.db.prepare(`
        UPDATE local_anomalies 
        SET synced = 1 
        WHERE id = ?
      `);
            for (const anomaly of unsynced) {
                updateStmt.run(anomaly.id);
            }
            logger_1.logger.info("Anomalies synced", { count: unsynced.length });
        }
        catch (error) {
            logger_1.logger.error("Failed to sync anomalies", error);
            throw error;
        }
    }
    async queueSync(entityType, payload) {
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const stmt = this.db.prepare(`
      INSERT INTO sync_queue (id, entity_type, entity_id, action, payload, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
        stmt.run(id, entityType, payload.id || id, "sync", JSON.stringify(payload), Date.now());
    }
    async processSyncQueue() {
        const queue = this.db
            .prepare(`
      SELECT * FROM sync_queue 
      WHERE retries < 3 
      ORDER BY created_at ASC 
      LIMIT ?
    `)
            .all(config_1.config.batchSize);
        for (const item of queue) {
            try {
                const payload = JSON.parse(item.payload);
                // Route to appropriate sync endpoint
                switch (item.entity_type) {
                    case "batch_ingestion":
                        await this.cloudApi.post("/api/edge-ai/batch-ingestion", {
                            node_key: this.nodeKey,
                            ...payload,
                        });
                        break;
                    default:
                        logger_1.logger.warn("Unknown entity type for sync", { type: item.entity_type });
                }
                // Remove from queue
                this.db.prepare("DELETE FROM sync_queue WHERE id = ?").run(item.id);
            }
            catch (error) {
                logger_1.logger.error("Sync queue item failed", error);
                // Increment retry count
                this.db
                    .prepare(`
          UPDATE sync_queue 
          SET retries = retries + 1 
          WHERE id = ?
        `)
                    .run(item.id);
            }
        }
    }
    async flush() {
        // Force sync all pending items
        await this.sync();
    }
}
exports.SyncService = SyncService;
//# sourceMappingURL=SyncService.js.map