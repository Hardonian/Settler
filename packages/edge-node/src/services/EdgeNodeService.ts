/**
 * Edge Node Service
 * Main service orchestrating local reconciliation, AI inference, and cloud sync
 */

import axios, { AxiosInstance } from "axios";
import Database from "better-sqlite3";
import { logger } from "../utils/logger";
import { config } from "../config";
import { IngestionService } from "./IngestionService";
import { MatchingService } from "./MatchingService";
import { AnomalyDetectionService } from "./AnomalyDetectionService";
import { SyncService } from "./SyncService";
import { ModelManager } from "./ModelManager";
import { PIIRedactionService } from "./PIIRedactionService";
import { v4 as uuidv4 } from "uuid";
import * as os from "os";
import * as fs from "fs";
import * as path from "path";

export interface EdgeNodeConfig {
  nodeKey: string;
  cloudApiUrl: string;
  dataDir: string;
}

export interface EnrollmentRequest {
  enrollmentKey: string;
  name: string;
  deviceType: string;
}

export interface EnrollmentResult {
  nodeId: string;
  nodeKey: string;
}

export interface NodeStatus {
  nodeId?: string;
  status: string;
  lastHeartbeat?: string;
  jobsProcessed?: number;
  localStorageUsed?: number;
}

export class EdgeNodeService {
  private nodeKey: string;
  private cloudApi: AxiosInstance;
  private db: Database.Database;
  private dataDir: string;
  private nodeId?: string;
  private isRunning: boolean = false;

  private ingestionService: IngestionService;
  private matchingService: MatchingService;
  private anomalyDetectionService: AnomalyDetectionService;
  private syncService: SyncService;
  private modelManager: ModelManager;
  private piiRedactionService: PIIRedactionService;

  private heartbeatInterval?: NodeJS.Timeout;
  private syncInterval?: NodeJS.Timeout;

  constructor(config: EdgeNodeConfig) {
    this.nodeKey = config.nodeKey;
    this.dataDir = config.dataDir;

    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    // Initialize SQLite database
    const dbPath = path.join(this.dataDir, "settler-edge.db");
    this.db = new Database(dbPath);
    this.initializeDatabase();

    // Initialize cloud API client
    this.cloudApi = axios.create({
      baseURL: config.cloudApiUrl,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    // Initialize services
    this.modelManager = new ModelManager(this.dataDir);
    this.piiRedactionService = new PIIRedactionService();
    this.ingestionService = new IngestionService(this.db, this.piiRedactionService);
    this.matchingService = new MatchingService(this.db, this.modelManager);
    this.anomalyDetectionService = new AnomalyDetectionService(this.db, this.modelManager);
    this.syncService = new SyncService(this.cloudApi, this.db, this.nodeKey);
  }

  private initializeDatabase(): void {
    // Create local tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS local_jobs (
        id TEXT PRIMARY KEY,
        job_type TEXT NOT NULL,
        status TEXT NOT NULL,
        input_data TEXT,
        output_data TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS local_candidates (
        id TEXT PRIMARY KEY,
        source_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        confidence_score REAL NOT NULL,
        score_matrix TEXT,
        synced INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS local_anomalies (
        id TEXT PRIMARY KEY,
        anomaly_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        transaction_data TEXT,
        synced INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        action TEXT NOT NULL,
        payload TEXT,
        retries INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_local_jobs_status ON local_jobs(status);
      CREATE INDEX IF NOT EXISTS idx_local_candidates_synced ON local_candidates(synced);
      CREATE INDEX IF NOT EXISTS idx_local_anomalies_synced ON local_anomalies(synced);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_retries ON sync_queue(retries);
    `);
  }

  async enroll(request: EnrollmentRequest): Promise<EnrollmentResult> {
    try {
      const deviceInfo = this.getDeviceInfo();

      const response = await this.cloudApi.post<{
        node_id: string;
        node_key: string;
      }>("/api/edge-ai/nodes/enroll", {
        enrollment_key: request.enrollmentKey,
        name: request.name,
        device_type: request.deviceType,
        device_os: deviceInfo.os,
        device_arch: deviceInfo.arch,
        capabilities: deviceInfo.capabilities,
        version: "1.0.0",
      });

      const result: EnrollmentResult = {
        nodeId: response.data.node_id,
        nodeKey: response.data.node_key,
      };

      this.nodeId = result.nodeId;
      this.nodeKey = result.nodeKey;

      // Save node key to file
      this.saveNodeKey(result.nodeKey);

      logger.info("Node enrolled successfully", { nodeId: result.nodeId });
      return result;
    } catch (error) {
      logger.error("Enrollment failed", error);
      throw error;
    }
  }

  start(): void {
    if (this.isRunning) {
      logger.warn("Edge node is already running");
      return;
    }

    if (!this.nodeKey) {
      throw new Error("Node key is required. Please enroll the node first.");
    }

    this.isRunning = true;
    logger.info("Starting edge node service...");

    // Start heartbeat
    this.startHeartbeat();

    // Start sync service
    this.startSync();

    // Load models
    this.modelManager.loadModels();

    logger.info("Edge node service started");
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    logger.info("Stopping edge node service...");

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    await this.syncService.flush();
    this.db.close();

    logger.info("Edge node service stopped");
  }

  private startHeartbeat(): void {
    void this.sendHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      void this.sendHeartbeat();
    }, config.heartbeatInterval);
  }

  private async sendHeartbeat(): Promise<void> {
    try {
      await this.cloudApi.post("/api/edge-ai/heartbeat", {
        node_key: this.nodeKey,
        status: "healthy",
        version: "1.0.0",
      });
      logger.debug("Heartbeat sent");
    } catch (error) {
      logger.error("Heartbeat failed", error);
    }
  }

  private startSync(): void {
    this.syncInterval = setInterval(() => {
      void (async () => {
        try {
          await this.syncService.sync();
        } catch (error) {
          logger.error("Sync failed", error);
        }
      })();
    }, config.syncInterval);
  }

  processIngestion(data: unknown[], schemaHints?: Record<string, string>): string {
    const jobId = uuidv4();

    try {
      // Store job
      const stmt = this.db.prepare(`
        INSERT INTO local_jobs (id, job_type, status, input_data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run(jobId, "ingestion", "running", JSON.stringify(data), Date.now(), Date.now());

      // Process ingestion
      const result = this.ingestionService.process(data, schemaHints);

      // Update job
      const updateStmt = this.db.prepare(`
        UPDATE local_jobs 
        SET status = ?, output_data = ?, updated_at = ?
        WHERE id = ?
      `);
      updateStmt.run("completed", JSON.stringify(result), Date.now(), jobId);

      // Queue for sync
      this.syncService.queueSync("batch_ingestion", {
        job_id: jobId,
        data: result.processedData,
        schema: result.inferredSchema,
      });

      return jobId;
    } catch (error) {
      logger.error("Ingestion processing failed", error);

      const errorStmt = this.db.prepare(`
        UPDATE local_jobs 
        SET status = ?, output_data = ?, updated_at = ?
        WHERE id = ?
      `);
      errorStmt.run("failed", JSON.stringify({ error: String(error) }), Date.now(), jobId);

      throw error;
    }
  }

  processMatching(sourceData: unknown[], targetData: unknown[]): string[] {
    const candidates = this.matchingService.findCandidates(sourceData, targetData);
    const candidateIds: string[] = [];

    for (const candidate of candidates) {
      const id = uuidv4();
      candidateIds.push(id);

      const stmt = this.db.prepare(`
        INSERT INTO local_candidates 
        (id, source_id, target_id, confidence_score, score_matrix, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        id,
        candidate.sourceId,
        candidate.targetId,
        candidate.confidenceScore,
        JSON.stringify(candidate.scoreMatrix),
        Date.now()
      );
    }

    // Queue for sync
    this.syncService.queueSync("candidate_scores", {
      candidates: candidates.map((c, i) => ({
        ...c,
        id: candidateIds[i],
      })),
    });

    return candidateIds;
  }

  detectAnomalies(data: unknown[]): string[] {
    const anomalies = this.anomalyDetectionService.detect(data);
    const anomalyIds: string[] = [];

    for (const anomaly of anomalies) {
      const id = uuidv4();
      anomalyIds.push(id);

      const stmt = this.db.prepare(`
        INSERT INTO local_anomalies 
        (id, anomaly_type, severity, transaction_data, created_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      stmt.run(
        id,
        anomaly.type,
        anomaly.severity,
        JSON.stringify(anomaly.transactionData),
        Date.now()
      );
    }

    // Queue for sync
    this.syncService.queueSync("anomalies", {
      anomalies: anomalies.map((a, i) => ({
        ...a,
        id: anomalyIds[i],
      })),
    });

    return anomalyIds;
  }

  getStatus(): NodeStatus {
    const jobCount = this.db.prepare("SELECT COUNT(*) as count FROM local_jobs").get() as {
      count: number;
    };

    const status: NodeStatus = {
      status: this.isRunning ? "running" : "stopped",
      lastHeartbeat: new Date().toISOString(), // TODO: Track actual last heartbeat
      jobsProcessed: jobCount?.count || 0,
      localStorageUsed: this.getStorageSize(),
    };

    if (this.nodeId) {
      status.nodeId = this.nodeId;
    }

    return status;
  }

  private getStorageSize(): number {
    try {
      const stats = fs.statSync(path.join(this.dataDir, "settler-edge.db"));
      return Math.round(stats.size / 1024 / 1024); // MB
    } catch {
      return 0;
    }
  }

  private getDeviceInfo(): {
    os: string;
    arch: string;
    capabilities: Record<string, boolean>;
  } {
    return {
      os: os.platform(),
      arch: os.arch(),
      capabilities: {
        cpu: true,
        gpu: false, // TODO: Detect GPU availability
        npu: false, // TODO: Detect NPU availability
        onnx_runtime: true, // TODO: Check if ONNX Runtime is available
        tensorrt: false,
        executorch: false,
        webgpu: false,
        wasm: false,
      },
    };
  }

  saveNodeKey(nodeKey: string): void {
    const keyPath = path.join(this.dataDir, ".node-key");
    fs.writeFileSync(keyPath, nodeKey, { mode: 0o600 }); // Read/write for owner only
    logger.info("Node key saved", { path: keyPath });
  }
}
