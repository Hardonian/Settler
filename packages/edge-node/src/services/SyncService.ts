/**
 * Sync Service
 * Handles synchronization of local data with Settler Cloud
 */

import { AxiosInstance } from "axios";
import Database from "better-sqlite3";
import { logger } from "../utils/logger";
import { config } from "../config";

export class SyncService {
  constructor(
    private cloudApi: AxiosInstance,
    private db: Database.Database,
    private nodeKey: string
  ) {}

  async sync(): Promise<void> {
    if (config.enableOfflineMode) {
      logger.debug("Offline mode enabled, skipping sync");
      return;
    }

    try {
      // Sync candidates
      await this.syncCandidates();

      // Sync anomalies
      await this.syncAnomalies();

      // Process sync queue
      await this.processSyncQueue();
    } catch (error) {
      logger.error("Sync failed", error);
      throw error;
    }
  }

  private async syncCandidates(): Promise<void> {
    const unsynced = this.db
      .prepare(
        `
      SELECT * FROM local_candidates 
      WHERE synced = 0 
      LIMIT ?
    `
      )
      .all(config.batchSize) as Array<{
      id: string;
      source_id: string;
      target_id: string;
      confidence_score: number;
      score_matrix: string;
    }>;

    if (unsynced.length === 0) {
      return;
    }

    try {
      const candidates = unsynced.map((c) => ({
        source_id: c.source_id,
        target_id: c.target_id,
        confidence_score: c.confidence_score,
        score_matrix: JSON.parse(c.score_matrix || "{}") as Record<string, unknown>,
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

      logger.info("Candidates synced", { count: unsynced.length });
    } catch (error) {
      logger.error("Failed to sync candidates", error);
      throw error;
    }
  }

  private async syncAnomalies(): Promise<void> {
    const unsynced = this.db
      .prepare(
        `
      SELECT * FROM local_anomalies 
      WHERE synced = 0 
      LIMIT ?
    `
      )
      .all(config.batchSize) as Array<{
      id: string;
      anomaly_type: string;
      severity: string;
      transaction_data: string;
    }>;

    if (unsynced.length === 0) {
      return;
    }

    try {
      const anomalies = unsynced.map((a) => ({
        anomaly_type: a.anomaly_type,
        severity: a.severity as "low" | "medium" | "high" | "critical",
        transaction_data: JSON.parse(a.transaction_data || "{}") as Record<string, unknown>,
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

      logger.info("Anomalies synced", { count: unsynced.length });
    } catch (error) {
      logger.error("Failed to sync anomalies", error);
      throw error;
    }
  }

  queueSync(entityType: string, payload: Record<string, unknown>): void {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const stmt = this.db.prepare(`
      INSERT INTO sync_queue (id, entity_type, entity_id, action, payload, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      entityType,
      (payload.id as string) || id,
      "sync",
      JSON.stringify(payload),
      Date.now()
    );
  }

  private async processSyncQueue(): Promise<void> {
    const queue = this.db
      .prepare(
        `
      SELECT * FROM sync_queue 
      WHERE retries < 3 
      ORDER BY created_at ASC 
      LIMIT ?
    `
      )
      .all(config.batchSize) as Array<{
      id: string;
      entity_type: string;
      entity_id: string;
      action: string;
      payload: string;
      retries: number;
    }>;

    for (const item of queue) {
      try {
        const payload = JSON.parse(item.payload) as Record<string, unknown>;

        // Route to appropriate sync endpoint
        switch (item.entity_type) {
          case "batch_ingestion":
            await this.cloudApi.post("/api/edge-ai/batch-ingestion", {
              node_key: this.nodeKey,
              ...payload,
            });
            break;
          default:
            logger.warn("Unknown entity type for sync", { type: item.entity_type });
        }

        // Remove from queue
        this.db.prepare("DELETE FROM sync_queue WHERE id = ?").run(item.id);
      } catch (error) {
        logger.error("Sync queue item failed", error);

        // Increment retry count
        this.db
          .prepare(
            `
          UPDATE sync_queue 
          SET retries = retries + 1 
          WHERE id = ?
        `
          )
          .run(item.id);
      }
    }
  }

  async flush(): Promise<void> {
    // Force sync all pending items
    await this.sync();
  }
}
