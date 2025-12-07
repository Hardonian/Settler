"use strict";
/**
 * Edge Node Service
 * Main service orchestrating local reconciliation, AI inference, and cloud sync
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EdgeNodeService = void 0;
const axios_1 = __importDefault(require("axios"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const logger_1 = require("../utils/logger");
const config_1 = require("../config");
const IngestionService_1 = require("./IngestionService");
const MatchingService_1 = require("./MatchingService");
const AnomalyDetectionService_1 = require("./AnomalyDetectionService");
const SyncService_1 = require("./SyncService");
const ModelManager_1 = require("./ModelManager");
const PIIRedactionService_1 = require("./PIIRedactionService");
const uuid_1 = require("uuid");
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class EdgeNodeService {
    nodeKey;
    cloudApi;
    db;
    dataDir;
    nodeId;
    isRunning = false;
    ingestionService;
    matchingService;
    anomalyDetectionService;
    syncService;
    modelManager;
    piiRedactionService;
    heartbeatInterval;
    syncInterval;
    constructor(config) {
        this.nodeKey = config.nodeKey;
        this.dataDir = config.dataDir;
        // Ensure data directory exists
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
        }
        // Initialize SQLite database
        const dbPath = path.join(this.dataDir, "settler-edge.db");
        this.db = new better_sqlite3_1.default(dbPath);
        this.initializeDatabase();
        // Initialize cloud API client
        this.cloudApi = axios_1.default.create({
            baseURL: config.cloudApiUrl,
            headers: {
                "Content-Type": "application/json",
            },
            timeout: 30000,
        });
        // Initialize services
        this.modelManager = new ModelManager_1.ModelManager(this.dataDir);
        this.piiRedactionService = new PIIRedactionService_1.PIIRedactionService();
        this.ingestionService = new IngestionService_1.IngestionService(this.db, this.piiRedactionService);
        this.matchingService = new MatchingService_1.MatchingService(this.db, this.modelManager);
        this.anomalyDetectionService = new AnomalyDetectionService_1.AnomalyDetectionService(this.db, this.modelManager);
        this.syncService = new SyncService_1.SyncService(this.cloudApi, this.db, this.nodeKey);
    }
    initializeDatabase() {
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
    async enroll(request) {
        try {
            const deviceInfo = this.getDeviceInfo();
            const response = await this.cloudApi.post("/api/edge-ai/nodes/enroll", {
                enrollment_key: request.enrollmentKey,
                name: request.name,
                device_type: request.deviceType,
                device_os: deviceInfo.os,
                device_arch: deviceInfo.arch,
                capabilities: deviceInfo.capabilities,
                version: "1.0.0",
            });
            const result = {
                nodeId: response.data.node_id,
                nodeKey: response.data.node_key,
            };
            this.nodeId = result.nodeId;
            this.nodeKey = result.nodeKey;
            // Save node key to file
            await this.saveNodeKey(result.nodeKey);
            logger_1.logger.info("Node enrolled successfully", { nodeId: result.nodeId });
            return result;
        }
        catch (error) {
            logger_1.logger.error("Enrollment failed", error);
            throw error;
        }
    }
    async start() {
        if (this.isRunning) {
            logger_1.logger.warn("Edge node is already running");
            return;
        }
        if (!this.nodeKey) {
            throw new Error("Node key is required. Please enroll the node first.");
        }
        this.isRunning = true;
        logger_1.logger.info("Starting edge node service...");
        // Start heartbeat
        this.startHeartbeat();
        // Start sync service
        this.startSync();
        // Load models
        await this.modelManager.loadModels();
        logger_1.logger.info("Edge node service started");
    }
    async stop() {
        if (!this.isRunning) {
            return;
        }
        this.isRunning = false;
        logger_1.logger.info("Stopping edge node service...");
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        await this.syncService.flush();
        this.db.close();
        logger_1.logger.info("Edge node service stopped");
    }
    startHeartbeat() {
        this.sendHeartbeat();
        this.heartbeatInterval = setInterval(() => {
            this.sendHeartbeat();
        }, config_1.config.heartbeatInterval);
    }
    async sendHeartbeat() {
        try {
            await this.cloudApi.post("/api/edge-ai/heartbeat", {
                node_key: this.nodeKey,
                status: "healthy",
                version: "1.0.0",
            });
            logger_1.logger.debug("Heartbeat sent");
        }
        catch (error) {
            logger_1.logger.error("Heartbeat failed", error);
        }
    }
    startSync() {
        this.syncInterval = setInterval(async () => {
            try {
                await this.syncService.sync();
            }
            catch (error) {
                logger_1.logger.error("Sync failed", error);
            }
        }, config_1.config.syncInterval);
    }
    async processIngestion(data, schemaHints) {
        const jobId = (0, uuid_1.v4)();
        try {
            // Store job
            const stmt = this.db.prepare(`
        INSERT INTO local_jobs (id, job_type, status, input_data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
            stmt.run(jobId, "ingestion", "running", JSON.stringify(data), Date.now(), Date.now());
            // Process ingestion
            const result = await this.ingestionService.process(data, schemaHints);
            // Update job
            const updateStmt = this.db.prepare(`
        UPDATE local_jobs 
        SET status = ?, output_data = ?, updated_at = ?
        WHERE id = ?
      `);
            updateStmt.run("completed", JSON.stringify(result), Date.now(), jobId);
            // Queue for sync
            await this.syncService.queueSync("batch_ingestion", {
                job_id: jobId,
                data: result.processedData,
                schema: result.inferredSchema,
            });
            return jobId;
        }
        catch (error) {
            logger_1.logger.error("Ingestion processing failed", error);
            const errorStmt = this.db.prepare(`
        UPDATE local_jobs 
        SET status = ?, output_data = ?, updated_at = ?
        WHERE id = ?
      `);
            errorStmt.run("failed", JSON.stringify({ error: String(error) }), Date.now(), jobId);
            throw error;
        }
    }
    async processMatching(sourceData, targetData) {
        const candidates = await this.matchingService.findCandidates(sourceData, targetData);
        const candidateIds = [];
        for (const candidate of candidates) {
            const id = (0, uuid_1.v4)();
            candidateIds.push(id);
            const stmt = this.db.prepare(`
        INSERT INTO local_candidates 
        (id, source_id, target_id, confidence_score, score_matrix, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
            stmt.run(id, candidate.sourceId, candidate.targetId, candidate.confidenceScore, JSON.stringify(candidate.scoreMatrix), Date.now());
        }
        // Queue for sync
        await this.syncService.queueSync("candidate_scores", {
            candidates: candidates.map((c, i) => ({
                ...c,
                id: candidateIds[i],
            })),
        });
        return candidateIds;
    }
    async detectAnomalies(data) {
        const anomalies = await this.anomalyDetectionService.detect(data);
        const anomalyIds = [];
        for (const anomaly of anomalies) {
            const id = (0, uuid_1.v4)();
            anomalyIds.push(id);
            const stmt = this.db.prepare(`
        INSERT INTO local_anomalies 
        (id, anomaly_type, severity, transaction_data, created_at)
        VALUES (?, ?, ?, ?, ?)
      `);
            stmt.run(id, anomaly.type, anomaly.severity, JSON.stringify(anomaly.transactionData), Date.now());
        }
        // Queue for sync
        await this.syncService.queueSync("anomalies", {
            anomalies: anomalies.map((a, i) => ({
                ...a,
                id: anomalyIds[i],
            })),
        });
        return anomalyIds;
    }
    async getStatus() {
        const jobCount = this.db.prepare("SELECT COUNT(*) as count FROM local_jobs").get();
        const status = {
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
    getStorageSize() {
        try {
            const stats = fs.statSync(path.join(this.dataDir, "settler-edge.db"));
            return Math.round(stats.size / 1024 / 1024); // MB
        }
        catch {
            return 0;
        }
    }
    getDeviceInfo() {
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
    async saveNodeKey(nodeKey) {
        const keyPath = path.join(this.dataDir, ".node-key");
        fs.writeFileSync(keyPath, nodeKey, { mode: 0o600 }); // Read/write for owner only
        logger_1.logger.info("Node key saved", { path: keyPath });
    }
}
exports.EdgeNodeService = EdgeNodeService;
//# sourceMappingURL=EdgeNodeService.js.map