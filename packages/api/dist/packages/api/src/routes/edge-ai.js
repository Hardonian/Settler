"use strict";
/**
 * Settler.dev Edge AI Routes
 *
 * NOTE: This is Settler.dev's Edge AI implementation. It uses:
 * - Shared edge-ai-core module for technical components
 * - AIAS API for model optimization (not direct code)
 * - Independent branding, pricing, and UI
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.edgeAiRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const validation_1 = require("../middleware/validation");
const authorization_1 = require("../middleware/authorization");
const Permissions_1 = require("../infrastructure/security/Permissions");
const db_1 = require("../db");
const logger_1 = require("../utils/logger");
const api_response_1 = require("../utils/api-response");
const error_handler_1 = require("../utils/error-handler");
const event_tracker_1 = require("../utils/event-tracker");
const bcrypt_1 = __importDefault(require("bcrypt"));
// Import shared edge-ai-core utilities (brand-neutral)
const edge_ai_core_1 = require("@settler/edge-ai-core");
const router = (0, express_1.Router)();
exports.edgeAiRouter = router;
// ============================================================================
// Validation Schemas
// ============================================================================
const createEdgeNodeSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(255),
        device_type: zod_1.z.enum(["server", "embedded", "mobile", "edge_gateway"]).optional(),
        device_os: zod_1.z.string().max(100).optional(),
        device_arch: zod_1.z.string().max(50).optional(),
        capabilities: zod_1.z.record(zod_1.z.boolean()).optional(),
        location: zod_1.z
            .object({
            region: zod_1.z.string().optional(),
            lat: zod_1.z.number().optional(),
            lng: zod_1.z.number().optional(),
        })
            .optional(),
        metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
    }),
});
const enrollEdgeNodeSchema = zod_1.z.object({
    body: zod_1.z.object({
        enrollment_key: zod_1.z.string().min(1),
        name: zod_1.z.string().min(1).max(255),
        device_type: zod_1.z.string().max(100).optional(),
        device_os: zod_1.z.string().max(100).optional(),
        device_arch: zod_1.z.string().max(50).optional(),
        capabilities: zod_1.z.record(zod_1.z.boolean()).optional(),
        version: zod_1.z.string().max(50).optional(),
    }),
});
const updateEdgeNodeSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid(),
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).max(255).optional(),
        status: zod_1.z.enum(["active", "inactive"]).optional(),
        capabilities: zod_1.z.record(zod_1.z.boolean()).optional(),
        location: zod_1.z
            .object({
            region: zod_1.z.string().optional(),
            lat: zod_1.z.number().optional(),
            lng: zod_1.z.number().optional(),
        })
            .optional(),
        metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
    }),
});
const heartbeatSchema = zod_1.z.object({
    body: zod_1.z.object({
        node_key: zod_1.z.string().min(1),
        status: zod_1.z.enum(["healthy", "degraded", "error"]).optional(),
        version: zod_1.z.string().max(50).optional(),
        metrics: zod_1.z.record(zod_1.z.unknown()).optional(),
    }),
});
const batchIngestionSchema = zod_1.z.object({
    body: zod_1.z.object({
        node_key: zod_1.z.string().min(1),
        job_id: zod_1.z.string().uuid().optional(),
        data: zod_1.z.array(zod_1.z.record(zod_1.z.unknown())),
        schema_hints: zod_1.z.record(zod_1.z.string()).optional(),
        metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
    }),
});
const candidateScoresSchema = zod_1.z.object({
    body: zod_1.z.object({
        node_key: zod_1.z.string().min(1),
        job_id: zod_1.z.string().uuid().optional(),
        execution_id: zod_1.z.string().uuid().optional(),
        candidates: zod_1.z.array(zod_1.z.object({
            source_id: zod_1.z.string().min(1),
            target_id: zod_1.z.string().min(1),
            confidence_score: zod_1.z.number().min(0).max(1),
            match_algorithm: zod_1.z.string().optional(),
            score_matrix: zod_1.z.record(zod_1.z.unknown()).optional(),
            features: zod_1.z.record(zod_1.z.unknown()).optional(),
        })),
        model_version_id: zod_1.z.string().uuid().optional(),
    }),
});
const anomalyReportSchema = zod_1.z.object({
    body: zod_1.z.object({
        node_key: zod_1.z.string().min(1),
        job_id: zod_1.z.string().uuid().optional(),
        execution_id: zod_1.z.string().uuid().optional(),
        anomalies: zod_1.z.array(zod_1.z.object({
            anomaly_type: zod_1.z.string().min(1),
            severity: zod_1.z.enum(["low", "medium", "high", "critical"]),
            transaction_data: zod_1.z.record(zod_1.z.unknown()).optional(),
            anomaly_score: zod_1.z.number().min(0).max(1).optional(),
            metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
        })),
        model_version_id: zod_1.z.string().uuid().optional(),
    }),
});
const deviceProfileSchema = zod_1.z.object({
    body: zod_1.z.object({
        node_key: zod_1.z.string().min(1),
        device_specs: zod_1.z.record(zod_1.z.unknown()),
        benchmark_results: zod_1.z.record(zod_1.z.unknown()).optional(),
        optimization_settings: zod_1.z.record(zod_1.z.unknown()).optional(),
    }),
});
// ============================================================================
// Helper Functions
// ============================================================================
async function authenticateEdgeNode(nodeKey) {
    // Use shared edge-ai-core utility
    const nodeKeyHash = (0, edge_ai_core_1.hashNodeKey)(nodeKey);
    const result = await (0, db_1.query)(`SELECT id, tenant_id FROM edge_nodes 
     WHERE node_key_hash = $1 AND status = 'active' AND deleted_at IS NULL`, [nodeKeyHash]);
    if (result.length === 0) {
        return null;
    }
    // Update last heartbeat
    await (0, db_1.query)(`UPDATE edge_nodes SET last_heartbeat_at = NOW() WHERE id = $1`, [
        result[0]?.id || "",
    ]);
    return {
        nodeId: result[0]?.id || "",
        tenantId: result[0]?.tenant_id || "",
    };
}
// Use shared edge-ai-core utilities instead of local implementations
function hashKey(key) {
    return (0, edge_ai_core_1.hashNodeKey)(key);
}
// ============================================================================
// Edge Node Management Routes
// ============================================================================
/**
 * POST /api/edge-ai/nodes
 * Create a new edge node
 */
router.post("/nodes", (0, validation_1.validateRequest)(createEdgeNodeSchema), (0, authorization_1.requirePermission)(Permissions_1.Permission.EDGE_NODES_WRITE), async (req, res) => {
    try {
        const { name, device_type, device_os, device_arch, capabilities, location, metadata } = req.body;
        const tenantId = req.tenantId;
        // Use shared edge-ai-core utilities
        const nodeKey = (0, edge_ai_core_1.generateNodeKey)();
        const nodeKeyHash = hashKey(nodeKey);
        const enrollmentKey = (0, edge_ai_core_1.generateEnrollmentKey)();
        const enrollmentKeyHash = await bcrypt_1.default.hash(enrollmentKey, 10);
        const result = await (0, db_1.query)(`INSERT INTO edge_nodes (
        tenant_id, name, node_key, node_key_hash, enrollment_key_hash,
        device_type, device_os, device_arch, capabilities, location, metadata, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id`, [
            tenantId,
            name,
            nodeKey,
            nodeKeyHash,
            enrollmentKeyHash,
            device_type || null,
            device_os || null,
            device_arch || null,
            JSON.stringify(capabilities || {}),
            JSON.stringify(location || {}),
            JSON.stringify(metadata || {}),
            "pending",
        ]);
        const nodeId = result[0]?.id || "";
        await (0, event_tracker_1.trackEventAsync)(tenantId, "edge_node_created", {
            node_id: nodeId,
            device_type,
        });
        (0, logger_1.logInfo)(`Edge node created: ${nodeId} for tenant ${tenantId}`);
        (0, api_response_1.sendCreated)(res, {
            id: nodeId,
            name,
            node_key: nodeKey, // Only returned once
            enrollment_key: enrollmentKey, // Only returned once
            status: "pending",
            created_at: new Date().toISOString(),
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to create edge node", 500);
    }
});
/**
 * POST /api/edge-ai/nodes/enroll
 * Enroll an edge node using enrollment key (public endpoint for nodes)
 */
router.post("/nodes/enroll", (0, validation_1.validateRequest)(enrollEdgeNodeSchema), async (req, res) => {
    try {
        const { enrollment_key, name, device_type, device_os, device_arch, capabilities, version } = req.body;
        // Find node by enrollment key
        const nodes = await (0, db_1.query)(`SELECT id, tenant_id, enrollment_key_hash, status 
       FROM edge_nodes 
       WHERE status = 'pending' AND deleted_at IS NULL`);
        let matchedNode = null;
        for (const node of nodes) {
            const isValid = await bcrypt_1.default.compare(enrollment_key, node.enrollment_key_hash);
            if (isValid) {
                matchedNode = { id: node.id, tenant_id: node.tenant_id };
                break;
            }
        }
        if (!matchedNode) {
            (0, api_response_1.sendError)(res, 401, "INVALID_ENROLLMENT_KEY", "Invalid enrollment key");
            return;
        }
        // Use shared edge-ai-core utilities
        const nodeKey = (0, edge_ai_core_1.generateNodeKey)();
        const nodeKeyHash = hashKey(nodeKey);
        // Activate the node
        await (0, db_1.query)(`UPDATE edge_nodes 
       SET node_key = $1, node_key_hash = $2, name = $3, 
           device_type = $4, device_os = $5, device_arch = $6,
           capabilities = $7, version = $8, status = 'active',
           enrollment_key_hash = NULL, last_heartbeat_at = NOW()
       WHERE id = $9`, [
            nodeKey,
            nodeKeyHash,
            name,
            device_type || null,
            device_os || null,
            device_arch || null,
            JSON.stringify(capabilities || {}),
            version || null,
            matchedNode.id,
        ]);
        await (0, event_tracker_1.trackEventAsync)(matchedNode.tenant_id, "edge_node_enrolled", {
            node_id: matchedNode.id,
        });
        (0, logger_1.logInfo)(`Edge node enrolled: ${matchedNode.id}`);
        (0, api_response_1.sendSuccess)(res, {
            node_id: matchedNode.id,
            node_key: nodeKey, // Only returned once
            status: "active",
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to enroll edge node", 500);
    }
});
/**
 * GET /api/edge-ai/nodes
 * List all edge nodes for tenant
 */
router.get("/nodes", (0, authorization_1.requirePermission)(Permissions_1.Permission.EDGE_NODES_READ), async (req, res) => {
    try {
        const tenantId = req.tenantId;
        const { page = "1", limit = "100" } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        const result = await (0, db_1.query)(`SELECT id, name, status, device_type, last_heartbeat_at, created_at
       FROM edge_nodes
       WHERE tenant_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`, [tenantId, Number(limit), offset]);
        const countResult = await (0, db_1.query)(`SELECT COUNT(*) as count FROM edge_nodes 
       WHERE tenant_id = $1 AND deleted_at IS NULL`, [tenantId]);
        (0, api_response_1.sendSuccess)(res, {
            nodes: result,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: Number(countResult[0]?.count || 0),
            },
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to list edge nodes", 500);
    }
});
/**
 * GET /api/edge-ai/nodes/:id
 * Get edge node details
 */
router.get("/nodes/:id", (0, validation_1.validateRequest)(zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.string().uuid() }),
})), (0, authorization_1.requirePermission)(Permissions_1.Permission.EDGE_NODES_READ), async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.tenantId;
        const result = await (0, db_1.query)(`SELECT id, name, status, device_type, device_os, device_arch,
              capabilities, location, last_heartbeat_at, last_sync_at,
              version, metadata, created_at
       FROM edge_nodes
       WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`, [id || "", tenantId || ""]);
        if (result.length === 0) {
            (0, api_response_1.sendError)(res, 404, "EDGE_NODE_NOT_FOUND", "Edge node not found");
            return;
        }
        const node = result[0];
        if (!node) {
            (0, api_response_1.sendError)(res, 404, "EDGE_NODE_NOT_FOUND", "Edge node not found");
            return;
        }
        (0, api_response_1.sendSuccess)(res, {
            ...node,
            capabilities: JSON.parse(node.capabilities || "{}"),
            location: JSON.parse(node.location || "{}"),
            metadata: JSON.parse(node.metadata || "{}"),
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to get edge node", 500);
    }
});
/**
 * PATCH /api/edge-ai/nodes/:id
 * Update edge node
 */
router.patch("/nodes/:id", (0, validation_1.validateRequest)(updateEdgeNodeSchema), (0, authorization_1.requirePermission)(Permissions_1.Permission.EDGE_NODES_WRITE), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, status, capabilities, location, metadata } = req.body;
        const tenantId = req.tenantId;
        const updates = [];
        const values = [];
        let paramIndex = 1;
        if (name !== undefined) {
            updates.push(`name = $${paramIndex++}`);
            values.push(name);
        }
        if (status !== undefined) {
            updates.push(`status = $${paramIndex++}`);
            values.push(status);
        }
        if (capabilities !== undefined) {
            updates.push(`capabilities = $${paramIndex++}`);
            values.push(JSON.stringify(capabilities));
        }
        if (location !== undefined) {
            updates.push(`location = $${paramIndex++}`);
            values.push(JSON.stringify(location));
        }
        if (metadata !== undefined) {
            updates.push(`metadata = $${paramIndex++}`);
            values.push(JSON.stringify(metadata));
        }
        if (updates.length === 0) {
            (0, api_response_1.sendError)(res, 400, "NO_FIELDS_TO_UPDATE", "No fields to update");
            return;
        }
        values.push(id || "", tenantId || "");
        await (0, db_1.query)(`UPDATE edge_nodes 
       SET ${updates.join(", ")}, updated_at = NOW()
       WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex++}`, values);
        await (0, event_tracker_1.trackEventAsync)(tenantId, "edge_node_updated", { node_id: id });
        (0, api_response_1.sendNoContent)(res);
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to update edge node", 500);
    }
});
/**
 * DELETE /api/edge-ai/nodes/:id
 * Delete (soft delete) edge node
 */
router.delete("/nodes/:id", (0, validation_1.validateRequest)(zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.string().uuid() }),
})), (0, authorization_1.requirePermission)(Permissions_1.Permission.EDGE_NODES_WRITE), async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.tenantId;
        await (0, db_1.query)(`UPDATE edge_nodes 
       SET deleted_at = NOW(), status = 'revoked', updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2`, [id || "", tenantId || ""]);
        await (0, event_tracker_1.trackEventAsync)(tenantId, "edge_node_deleted", { node_id: id });
        (0, api_response_1.sendNoContent)(res);
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to update edge node", 500);
    }
});
// ============================================================================
// Edge Node Operations (Authenticated by node_key)
// ============================================================================
/**
 * POST /api/edge-ai/heartbeat
 * Edge node heartbeat (public endpoint, authenticated by node_key)
 */
router.post("/heartbeat", (0, validation_1.validateRequest)(heartbeatSchema), async (req, res) => {
    try {
        const { node_key, version } = req.body;
        const auth = await authenticateEdgeNode(node_key);
        if (!auth) {
            (0, api_response_1.sendError)(res, 401, "INVALID_NODE_KEY", "Invalid node key");
            return;
        }
        const updates = ["last_heartbeat_at = NOW()"];
        const values = [];
        let paramIndex = 1;
        if (version !== undefined) {
            updates.push(`version = $${paramIndex++}`);
            values.push(version);
        }
        if (updates.length > 1) {
            values.push(auth.nodeId || "");
            await (0, db_1.query)(`UPDATE edge_nodes SET ${updates.join(", ")} WHERE id = $${paramIndex}`, values);
        }
        (0, api_response_1.sendSuccess)(res, { status: "ok", timestamp: new Date().toISOString() });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to process heartbeat", 500);
    }
});
/**
 * POST /api/edge-ai/batch-ingestion
 * Ingest batch data from edge node
 */
router.post("/batch-ingestion", (0, validation_1.validateRequest)(batchIngestionSchema), async (req, res) => {
    try {
        const { node_key, job_id, data, schema_hints, metadata } = req.body;
        const auth = await authenticateEdgeNode(node_key);
        if (!auth) {
            (0, api_response_1.sendError)(res, 401, "INVALID_NODE_KEY", "Invalid node key");
            return;
        }
        // Create edge job record
        const jobResult = await (0, db_1.query)(`INSERT INTO edge_jobs (
        edge_node_id, tenant_id, job_type, status, input_data, metadata
      ) VALUES ($1, $2, 'ingestion', 'running', $3, $4)
      RETURNING id`, [
            auth.nodeId,
            auth.tenantId,
            JSON.stringify({ data, schema_hints }),
            JSON.stringify(metadata || {}),
        ]);
        const edgeJobId = jobResult[0]?.id || "";
        // TODO: Process ingestion (schema inference, PII detection, etc.)
        // For now, mark as completed
        await (0, db_1.query)(`UPDATE edge_jobs 
       SET status = 'completed', completed_at = NOW(), 
           output_data = $1, duration_ms = EXTRACT(EPOCH FROM (NOW() - started_at)) * 1000
       WHERE id = $2`, [JSON.stringify({ records_processed: data.length }), edgeJobId]);
        await (0, event_tracker_1.trackEventAsync)(auth.tenantId, "edge_batch_ingested", {
            node_id: auth.nodeId,
            job_id,
            record_count: data.length,
        });
        (0, api_response_1.sendSuccess)(res, {
            edge_job_id: edgeJobId,
            records_processed: data.length,
            status: "completed",
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to ingest batch data", 500);
    }
});
/**
 * POST /api/edge-ai/candidate-scores
 * Submit candidate match scores from edge node
 */
router.post("/candidate-scores", (0, validation_1.validateRequest)(candidateScoresSchema), async (req, res) => {
    try {
        const { node_key, job_id, execution_id, candidates, model_version_id } = req.body;
        const auth = await authenticateEdgeNode(node_key);
        if (!auth) {
            (0, api_response_1.sendError)(res, 401, "INVALID_NODE_KEY", "Invalid node key");
            return;
        }
        // Insert candidates
        const candidateIds = [];
        for (const candidate of candidates) {
            const result = await (0, db_1.query)(`INSERT INTO reconciliation_candidates (
          tenant_id, job_id, execution_id, edge_node_id, model_version_id,
          source_id, target_id, confidence_score, match_algorithm,
          score_matrix, features
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id`, [
                auth.tenantId,
                job_id || null,
                execution_id || null,
                auth.nodeId,
                model_version_id || null,
                candidate.source_id,
                candidate.target_id,
                candidate.confidence_score,
                candidate.match_algorithm || null,
                JSON.stringify(candidate.score_matrix || {}),
                JSON.stringify(candidate.features || {}),
            ]);
            if (result[0]?.id)
                candidateIds.push(result[0].id);
        }
        await (0, event_tracker_1.trackEventAsync)(auth.tenantId, "edge_candidates_submitted", {
            node_id: auth.nodeId,
            job_id,
            candidate_count: candidates.length,
        });
        (0, api_response_1.sendSuccess)(res, {
            candidates_created: candidateIds.length,
            candidate_ids: candidateIds,
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to submit candidate scores", 500);
    }
});
/**
 * POST /api/edge-ai/anomalies
 * Report anomalies from edge node
 */
router.post("/anomalies", (0, validation_1.validateRequest)(anomalyReportSchema), async (req, res) => {
    try {
        const { node_key, job_id, execution_id, anomalies, model_version_id } = req.body;
        const auth = await authenticateEdgeNode(node_key);
        if (!auth) {
            (0, api_response_1.sendError)(res, 401, "INVALID_NODE_KEY", "Invalid node key");
            return;
        }
        const anomalyIds = [];
        for (const anomaly of anomalies) {
            const result = await (0, db_1.query)(`INSERT INTO anomaly_events (
          tenant_id, edge_node_id, job_id, execution_id, model_version_id,
          anomaly_type, severity, transaction_data, anomaly_score
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id`, [
                auth.tenantId,
                auth.nodeId,
                job_id || null,
                execution_id || null,
                model_version_id || null,
                anomaly.anomaly_type,
                anomaly.severity,
                JSON.stringify(anomaly.transaction_data || {}),
                anomaly.anomaly_score || null,
            ]);
            if (result[0]?.id)
                anomalyIds.push(result[0].id);
        }
        await (0, event_tracker_1.trackEventAsync)(auth.tenantId, "edge_anomalies_reported", {
            node_id: auth.nodeId,
            job_id,
            anomaly_count: anomalies.length,
        });
        (0, api_response_1.sendSuccess)(res, {
            anomalies_created: anomalyIds.length,
            anomaly_ids: anomalyIds,
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to report anomalies", 500);
    }
});
/**
 * POST /api/edge-ai/device-profile
 * Submit device profile and benchmark results
 */
router.post("/device-profile", (0, validation_1.validateRequest)(deviceProfileSchema), async (req, res) => {
    try {
        const { node_key, device_specs, benchmark_results, optimization_settings } = req.body;
        const auth = await authenticateEdgeNode(node_key);
        if (!auth) {
            (0, api_response_1.sendError)(res, 401, "INVALID_NODE_KEY", "Invalid node key");
            return;
        }
        const result = await (0, db_1.query)(`INSERT INTO device_profiles (
        tenant_id, edge_node_id, profile_name, device_specs,
        benchmark_results, optimization_settings
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (edge_node_id, profile_name) 
      DO UPDATE SET device_specs = EXCLUDED.device_specs,
                    benchmark_results = EXCLUDED.benchmark_results,
                    optimization_settings = EXCLUDED.optimization_settings,
                    updated_at = NOW()
      RETURNING id`, [
            auth.tenantId,
            auth.nodeId,
            "default",
            JSON.stringify(device_specs),
            JSON.stringify(benchmark_results || {}),
            JSON.stringify(optimization_settings || {}),
        ]);
        (0, api_response_1.sendSuccess)(res, {
            profile_id: result[0]?.id || "",
            status: "created",
        });
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to submit device profile", 500);
    }
});
//# sourceMappingURL=edge-ai.js.map