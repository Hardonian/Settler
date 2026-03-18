/**
 * Settler.dev Edge AI Routes
 *
 * NOTE: This is Settler.dev's Edge AI implementation. It uses:
 * - Shared edge-ai-core module for technical components
 * - AIAS API for model optimization (not direct code)
 * - Independent branding, pricing, and UI
 */

import { Router, Response } from "express";
import { z } from "zod";
import { validateRequest } from "../middleware/validation";
import { AuthRequest } from "../middleware/auth";
import { requirePermission } from "../middleware/authorization";
import { enforceFreezeState } from "../middleware/governance";
import { Permission } from "../infrastructure/security/Permissions";
import { query } from "../db";
import { logInfo } from "../utils/logger";
import { sendSuccess, sendError, sendCreated, sendNoContent } from "../utils/api-response";
import { handleRouteError } from "../utils/error-handler";
import { trackEventAsync } from "../utils/event-tracker";
import bcrypt from "bcrypt";
// Import shared edge-ai-core utilities (brand-neutral)
// @ts-expect-error - No declaration file for @settler/edge-ai-core
import { generateNodeKey, hashNodeKey, generateEnrollmentKey } from "@settler/edge-ai-core";

const router: Router = Router();

// ============================================================================
// Validation Schemas
// ============================================================================

const createEdgeNodeSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    device_type: z.enum(["server", "embedded", "mobile", "edge_gateway"]).optional(),
    device_os: z.string().max(100).optional(),
    device_arch: z.string().max(50).optional(),
    capabilities: z.record(z.boolean()).optional(),
    location: z
      .object({
        region: z.string().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
      })
      .optional(),
    metadata: z.record(z.unknown()).optional(),
  }),
});

const enrollEdgeNodeSchema = z.object({
  body: z.object({
    enrollment_key: z.string().min(1),
    name: z.string().min(1).max(255),
    device_type: z.string().max(100).optional(),
    device_os: z.string().max(100).optional(),
    device_arch: z.string().max(50).optional(),
    capabilities: z.record(z.boolean()).optional(),
    version: z.string().max(50).optional(),
  }),
});

const updateEdgeNodeSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    status: z.enum(["active", "inactive"]).optional(),
    capabilities: z.record(z.boolean()).optional(),
    location: z
      .object({
        region: z.string().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
      })
      .optional(),
    metadata: z.record(z.unknown()).optional(),
  }),
});

const heartbeatSchema = z.object({
  body: z.object({
    node_key: z.string().min(1),
    status: z.enum(["healthy", "degraded", "error"]).optional(),
    version: z.string().max(50).optional(),
    metrics: z.record(z.unknown()).optional(),
  }),
});

const batchIngestionSchema = z.object({
  body: z.object({
    node_key: z.string().min(1),
    job_id: z.string().uuid().optional(),
    data: z.array(z.record(z.unknown())),
    schema_hints: z.record(z.string()).optional(),
    metadata: z.record(z.unknown()).optional(),
  }),
});

const candidateScoresSchema = z.object({
  body: z.object({
    node_key: z.string().min(1),
    job_id: z.string().uuid().optional(),
    execution_id: z.string().uuid().optional(),
    candidates: z.array(
      z.object({
        source_id: z.string().min(1),
        target_id: z.string().min(1),
        confidence_score: z.number().min(0).max(1),
        match_algorithm: z.string().optional(),
        score_matrix: z.record(z.unknown()).optional(),
        features: z.record(z.unknown()).optional(),
      })
    ),
    model_version_id: z.string().uuid().optional(),
  }),
});

const anomalyReportSchema = z.object({
  body: z.object({
    node_key: z.string().min(1),
    job_id: z.string().uuid().optional(),
    execution_id: z.string().uuid().optional(),
    anomalies: z.array(
      z.object({
        anomaly_type: z.string().min(1),
        severity: z.enum(["low", "medium", "high", "critical"]),
        transaction_data: z.record(z.unknown()).optional(),
        anomaly_score: z.number().min(0).max(1).optional(),
        metadata: z.record(z.unknown()).optional(),
      })
    ),
    model_version_id: z.string().uuid().optional(),
  }),
});

const deviceProfileSchema = z.object({
  body: z.object({
    node_key: z.string().min(1),
    device_specs: z.record(z.unknown()),
    benchmark_results: z.record(z.unknown()).optional(),
    optimization_settings: z.record(z.unknown()).optional(),
  }),
});

// ============================================================================
// Helper Functions
// ============================================================================

async function authenticateEdgeNode(
  nodeKey: string
): Promise<{ nodeId: string; tenantId: string } | null> {
  // Use shared edge-ai-core utility
  const nodeKeyHash = hashNodeKey(nodeKey);

  const result = await query<{ id: string; tenant_id: string }>(
    `SELECT id, tenant_id FROM edge_nodes
     WHERE node_key_hash = $1 AND status = 'active' AND deleted_at IS NULL`,
    [nodeKeyHash]
  );

  if (result.length === 0) {
    return null;
  }

  // Update last heartbeat
  await query(`UPDATE edge_nodes SET last_heartbeat_at = NOW() WHERE id = $1`, [
    result[0]?.id || "",
  ]);

  return {
    nodeId: result[0]?.id || "",
    tenantId: result[0]?.tenant_id || "",
  };
}

// Use shared edge-ai-core utilities instead of local implementations
function hashKey(key: string): string {
  return hashNodeKey(key);
}

// ============================================================================
// Edge Node Management Routes
// ============================================================================

/**
 * POST /api/edge-ai/nodes
 * Create a new edge node
 */
router.post(
  "/nodes",
  validateRequest(createEdgeNodeSchema),
  requirePermission(Permission.EDGE_NODES_WRITE),
  enforceFreezeState(),
  async (req: AuthRequest, res: Response) => {
    try {
      const { name, device_type, device_os, device_arch, capabilities, location, metadata } =
        req.body;
      const tenantId = req.tenantId!;

      // Use shared edge-ai-core utilities
      const nodeKey = generateNodeKey();
      const nodeKeyHash = hashKey(nodeKey);
      const enrollmentKey = generateEnrollmentKey();
      const enrollmentKeyHash = await bcrypt.hash(enrollmentKey, 10);

      const result = await query<{ id: string }>(
        `INSERT INTO edge_nodes (
        tenant_id, name, node_key, node_key_hash, enrollment_key_hash,
        device_type, device_os, device_arch, capabilities, location, metadata, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id`,
        [
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
        ]
      );

      const nodeId = result[0]?.id || "";

      await trackEventAsync(tenantId, "edge_node_created", {
        node_id: nodeId,
        device_type,
      });

      logInfo(`Edge node created: ${nodeId} for tenant ${tenantId}`);

      sendCreated(res, {
        id: nodeId,
        name,
        node_key: nodeKey, // Only returned once
        enrollment_key: enrollmentKey, // Only returned once
        status: "pending",
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      handleRouteError(res, error, "Failed to create edge node", 500);
    }
  }
);

/**
 * POST /api/edge-ai/nodes/enroll
 * Enroll an edge node using enrollment key (public endpoint for nodes)
 */
router.post(
  "/nodes/enroll",
  validateRequest(enrollEdgeNodeSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { enrollment_key, name, device_type, device_os, device_arch, capabilities, version } =
        req.body;

      // Find node by enrollment key
      const nodes = await query<{
        id: string;
        tenant_id: string;
        enrollment_key_hash: string;
        status: string;
      }>(
        `SELECT id, tenant_id, enrollment_key_hash, status
       FROM edge_nodes
       WHERE status = 'pending' AND deleted_at IS NULL`
      );

      let matchedNode: { id: string; tenant_id: string } | null = null;

      for (const node of nodes) {
        const isValid = await bcrypt.compare(enrollment_key, node.enrollment_key_hash);
        if (isValid) {
          matchedNode = { id: node.id, tenant_id: node.tenant_id };
          break;
        }
      }

      if (!matchedNode) {
        sendError(res, 401, "INVALID_ENROLLMENT_KEY", "Invalid enrollment key");
        return;
      }

      // Use shared edge-ai-core utilities
      const nodeKey = generateNodeKey();
      const nodeKeyHash = hashKey(nodeKey);

      // Activate the node
      await query(
        `UPDATE edge_nodes
       SET node_key = $1, node_key_hash = $2, name = $3,
           device_type = $4, device_os = $5, device_arch = $6,
           capabilities = $7, version = $8, status = 'active',
           enrollment_key_hash = NULL, last_heartbeat_at = NOW()
       WHERE id = $9`,
        [
          nodeKey,
          nodeKeyHash,
          name,
          device_type || null,
          device_os || null,
          device_arch || null,
          JSON.stringify(capabilities || {}),
          version || null,
          matchedNode.id,
        ]
      );

      await trackEventAsync(matchedNode.tenant_id, "edge_node_enrolled", {
        node_id: matchedNode.id,
      });

      logInfo(`Edge node enrolled: ${matchedNode.id}`);

      sendSuccess(res, {
        node_id: matchedNode.id,
        node_key: nodeKey, // Only returned once
        status: "active",
      });
    } catch (error) {
      handleRouteError(res, error, "Failed to enroll edge node", 500);
    }
  }
);

/**
 * GET /api/edge-ai/nodes
 * List all edge nodes for tenant
 */
router.get(
  "/nodes",
  requirePermission(Permission.EDGE_NODES_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.tenantId!;
      const { page = "1", limit = "100" } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const result = await query<{
        id: string;
        name: string;
        status: string;
        device_type: string;
        last_heartbeat_at: Date;
        created_at: Date;
      }>(
        `SELECT id, name, status, device_type, last_heartbeat_at, created_at
       FROM edge_nodes
       WHERE tenant_id = $1 AND deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
        [tenantId, Number(limit), offset]
      );

      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM edge_nodes
       WHERE tenant_id = $1 AND deleted_at IS NULL`,
        [tenantId]
      );

      sendSuccess(res, {
        nodes: result,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: Number(countResult[0]?.count || 0),
        },
      });
    } catch (error) {
      handleRouteError(res, error, "Failed to list edge nodes", 500);
    }
  }
);

/**
 * GET /api/edge-ai/nodes/:id
 * Get edge node details
 */
router.get(
  "/nodes/:id",
  validateRequest(
    z.object({
      params: z.object({ id: z.string().uuid() }),
    })
  ),
  requirePermission(Permission.EDGE_NODES_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId!;

      const result = await query<{
        id: string;
        name: string;
        status: string;
        device_type: string;
        device_os: string;
        device_arch: string;
        capabilities: string;
        location: string;
        last_heartbeat_at: Date;
        last_sync_at: Date;
        version: string;
        metadata: string;
        created_at: Date;
      }>(
        `SELECT id, name, status, device_type, device_os, device_arch,
              capabilities, location, last_heartbeat_at, last_sync_at,
              version, metadata, created_at
       FROM edge_nodes
       WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
        [id || "", tenantId || ""]
      );

      if (result.length === 0) {
        sendError(res, 404, "EDGE_NODE_NOT_FOUND", "Edge node not found");
        return;
      }

      const node = result[0];
      if (!node) {
        sendError(res, 404, "EDGE_NODE_NOT_FOUND", "Edge node not found");
        return;
      }
      sendSuccess(res, {
        ...node,
        capabilities: JSON.parse(node.capabilities || "{}"),
        location: JSON.parse(node.location || "{}"),
        metadata: JSON.parse(node.metadata || "{}"),
      });
    } catch (error) {
      handleRouteError(res, error, "Failed to get edge node", 500);
    }
  }
);

/**
 * PATCH /api/edge-ai/nodes/:id
 * Update edge node
 */
router.patch(
  "/nodes/:id",
  validateRequest(updateEdgeNodeSchema),
  requirePermission(Permission.EDGE_NODES_WRITE),
  enforceFreezeState(),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { name, status, capabilities, location, metadata } = req.body;
      const tenantId = req.tenantId!;

      const updates: string[] = [];
      const values: (string | number | boolean | Date | null)[] = [];
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
        sendError(res, 400, "NO_FIELDS_TO_UPDATE", "No fields to update");
        return;
      }

      values.push(id || "", tenantId || "");

      await query(
        `UPDATE edge_nodes
       SET ${updates.join(", ")}, updated_at = NOW()
       WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex++}`,
        values
      );

      await trackEventAsync(tenantId, "edge_node_updated", { node_id: id });

      sendNoContent(res);
    } catch (error) {
      handleRouteError(res, error, "Failed to update edge node", 500);
    }
  }
);

/**
 * DELETE /api/edge-ai/nodes/:id
 * Delete (soft delete) edge node
 */
router.delete(
  "/nodes/:id",
  validateRequest(
    z.object({
      params: z.object({ id: z.string().uuid() }),
    })
  ),
  requirePermission(Permission.EDGE_NODES_WRITE),
  enforceFreezeState(),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const tenantId = req.tenantId!;

      await query(
        `UPDATE edge_nodes
       SET deleted_at = NOW(), status = 'revoked', updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2`,
        [id || "", tenantId || ""]
      );

      await trackEventAsync(tenantId, "edge_node_deleted", { node_id: id });

      sendNoContent(res);
    } catch (error) {
      handleRouteError(res, error, "Failed to update edge node", 500);
    }
  }
);

// ============================================================================
// Edge Node Operations (Authenticated by node_key)
// ============================================================================

/**
 * POST /api/edge-ai/heartbeat
 * Edge node heartbeat (public endpoint, authenticated by node_key)
 */
router.post(
  "/heartbeat",
  validateRequest(heartbeatSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { node_key, version } = req.body;

      const auth = await authenticateEdgeNode(node_key);
      if (!auth) {
        sendError(res, 401, "INVALID_NODE_KEY", "Invalid node key");
        return;
      }

      const updates: string[] = ["last_heartbeat_at = NOW()"];
      const values: (string | number | boolean | Date | null)[] = [];
      let paramIndex = 1;

      if (version !== undefined) {
        updates.push(`version = $${paramIndex++}`);
        values.push(version);
      }

      if (updates.length > 1) {
        values.push(auth.nodeId || "");
        await query(
          `UPDATE edge_nodes SET ${updates.join(", ")} WHERE id = $${paramIndex}`,
          values
        );
      }

      sendSuccess(res, { status: "ok", timestamp: new Date().toISOString() });
    } catch (error) {
      handleRouteError(res, error, "Failed to process heartbeat", 500);
    }
  }
);

/**
 * POST /api/edge-ai/batch-ingestion
 * Ingest batch data from edge node
 */
router.post(
  "/batch-ingestion",
  validateRequest(batchIngestionSchema),
  enforceFreezeState(),
  async (req: AuthRequest, res: Response) => {
    try {
      const { node_key, job_id, data, schema_hints, metadata } = req.body;

      const auth = await authenticateEdgeNode(node_key);
      if (!auth) {
        sendError(res, 401, "INVALID_NODE_KEY", "Invalid node key");
        return;
      }

      // Create edge job record
      const jobResult = await query<{ id: string }>(
        `INSERT INTO edge_jobs (
        edge_node_id, tenant_id, job_type, status, input_data, metadata
      ) VALUES ($1, $2, 'ingestion', 'running', $3, $4)
      RETURNING id`,
        [
          auth.nodeId,
          auth.tenantId,
          JSON.stringify({ data, schema_hints }),
          JSON.stringify(metadata || {}),
        ]
      );

      const edgeJobId = jobResult[0]?.id || "";

      // TODO: Process ingestion (schema inference, PII detection, etc.)
      // For now, mark as completed
      await query(
        `UPDATE edge_jobs
       SET status = 'completed', completed_at = NOW(),
           output_data = $1, duration_ms = EXTRACT(EPOCH FROM (NOW() - started_at)) * 1000
       WHERE id = $2`,
        [JSON.stringify({ records_processed: data.length }), edgeJobId]
      );

      await trackEventAsync(auth.tenantId, "edge_batch_ingested", {
        node_id: auth.nodeId,
        job_id,
        record_count: data.length,
      });

      sendSuccess(res, {
        edge_job_id: edgeJobId,
        records_processed: data.length,
        status: "completed",
      });
    } catch (error) {
      handleRouteError(res, error, "Failed to ingest batch data", 500);
    }
  }
);

/**
 * POST /api/edge-ai/candidate-scores
 * Submit candidate match scores from edge node
 */
router.post(
  "/candidate-scores",
  validateRequest(candidateScoresSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { node_key, job_id, execution_id, candidates, model_version_id } = req.body;

      const auth = await authenticateEdgeNode(node_key);
      if (!auth) {
        sendError(res, 401, "INVALID_NODE_KEY", "Invalid node key");
        return;
      }

      // Insert candidates
      const candidateIds: string[] = [];
      for (const candidate of candidates) {
        const result = await query<{ id: string }>(
          `INSERT INTO reconciliation_candidates (
          tenant_id, job_id, execution_id, edge_node_id, model_version_id,
          source_id, target_id, confidence_score, match_algorithm,
          score_matrix, features
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id`,
          [
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
          ]
        );
        if (result[0]?.id) candidateIds.push(result[0].id);
      }

      await trackEventAsync(auth.tenantId, "edge_candidates_submitted", {
        node_id: auth.nodeId,
        job_id,
        candidate_count: candidates.length,
      });

      sendSuccess(res, {
        candidates_created: candidateIds.length,
        candidate_ids: candidateIds,
      });
    } catch (error) {
      handleRouteError(res, error, "Failed to submit candidate scores", 500);
    }
  }
);

/**
 * POST /api/edge-ai/anomalies
 * Report anomalies from edge node
 */
router.post(
  "/anomalies",
  validateRequest(anomalyReportSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { node_key, job_id, execution_id, anomalies, model_version_id } = req.body;

      const auth = await authenticateEdgeNode(node_key);
      if (!auth) {
        sendError(res, 401, "INVALID_NODE_KEY", "Invalid node key");
        return;
      }

      const anomalyIds: string[] = [];
      for (const anomaly of anomalies) {
        const result = await query<{ id: string }>(
          `INSERT INTO anomaly_events (
          tenant_id, edge_node_id, job_id, execution_id, model_version_id,
          anomaly_type, severity, transaction_data, anomaly_score
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id`,
          [
            auth.tenantId,
            auth.nodeId,
            job_id || null,
            execution_id || null,
            model_version_id || null,
            anomaly.anomaly_type,
            anomaly.severity,
            JSON.stringify(anomaly.transaction_data || {}),
            anomaly.anomaly_score || null,
          ]
        );
        if (result[0]?.id) anomalyIds.push(result[0].id);
      }

      await trackEventAsync(auth.tenantId, "edge_anomalies_reported", {
        node_id: auth.nodeId,
        job_id,
        anomaly_count: anomalies.length,
      });

      sendSuccess(res, {
        anomalies_created: anomalyIds.length,
        anomaly_ids: anomalyIds,
      });
    } catch (error) {
      handleRouteError(res, error, "Failed to report anomalies", 500);
    }
  }
);

/**
 * POST /api/edge-ai/device-profile
 * Submit device profile and benchmark results
 */
router.post(
  "/device-profile",
  validateRequest(deviceProfileSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { node_key, device_specs, benchmark_results, optimization_settings } = req.body;

      const auth = await authenticateEdgeNode(node_key);
      if (!auth) {
        sendError(res, 401, "INVALID_NODE_KEY", "Invalid node key");
        return;
      }

      const result = await query<{ id: string }>(
        `INSERT INTO device_profiles (
        tenant_id, edge_node_id, profile_name, device_specs,
        benchmark_results, optimization_settings
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (edge_node_id, profile_name)
      DO UPDATE SET device_specs = EXCLUDED.device_specs,
                    benchmark_results = EXCLUDED.benchmark_results,
                    optimization_settings = EXCLUDED.optimization_settings,
                    updated_at = NOW()
      RETURNING id`,
        [
          auth.tenantId,
          auth.nodeId,
          "default",
          JSON.stringify(device_specs),
          JSON.stringify(benchmark_results || {}),
          JSON.stringify(optimization_settings || {}),
        ]
      );

      sendSuccess(res, {
        profile_id: result[0]?.id || "",
        status: "created",
      });
    } catch (error) {
      handleRouteError(res, error, "Failed to submit device profile", 500);
    }
  }
);

export { router as edgeAiRouter };
