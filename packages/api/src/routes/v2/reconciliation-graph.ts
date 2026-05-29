/**
 * Continuous Reconciliation Graph API Routes
 *
 * REST API for graph-based reconciliation
 */

import * as crypto from "crypto";
import { Router, Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { requirePermission } from "../../middleware/authorization";
import { Permission } from "../../infrastructure/security/Permissions";
import { graphEngine } from "../../services/reconciliation-graph/graph-engine";
import { streamProcessor } from "../../services/reconciliation-graph/stream-processor";
import {
  ReconciliationNode,
  ReconciliationEdge,
  GraphQuery,
} from "../../services/reconciliation-graph/types";
import { handleRouteError } from "../../utils/error-handler";
import { authorizeTenantActionOr403, requireTenantContext } from "../authz-helpers";
import {
  buildStrategicSurfaceMetadata,
  requireStrategicSurfaceAvailability,
} from "./strategic-preview";

const router: Router = Router();
const RECONCILIATION_GRAPH_SURFACE = {
  key: "reconciliation_graph_v2",
  unavailableReason:
    "Reconciliation graph v2 is disabled until graph state is tenant-scoped and durably persisted.",
  previewReason:
    "Reconciliation graph v2 is running in local-only preview mode without tenant-scoped durable storage.",
};

/**
 * POST /api/v2/reconciliation-graph/:jobId/nodes
 * Add a node to the graph
 */
router.post(
  "/:jobId/nodes",
  requirePermission(Permission.TENANT_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantContext(req, res);
      if (!tenantId) return;
      if (
        !(await authorizeTenantActionOr403(
          req,
          res,
          tenantId,
          "tenant.knowledge.manage",
          "Reconciliation graph mutation is not authorized"
        ))
      ) {
        return;
      }
      const capability = requireStrategicSurfaceAvailability(
        req,
        res,
        "/api/v2/reconciliation-graph/:jobId/nodes",
        RECONCILIATION_GRAPH_SURFACE
      );
      if (!capability) return;
      const jobId = req.params.jobId as string;
      if (!jobId) {
        return res.status(400).json({ error: "Job ID is required" });
      }
      const node: ReconciliationNode = {
        id: req.body.id || `node_${Date.now()}_${crypto.randomUUID()}`,
        type: req.body.type || "transaction",
        jobId,
        sourceId: req.body.sourceId || undefined,
        targetId: req.body.targetId || undefined,
        data: req.body.data || {},
        amount: req.body.amount,
        currency: req.body.currency,
        timestamp: req.body.timestamp ? new Date(req.body.timestamp) : new Date(),
        confidence: req.body.confidence,
        metadata: req.body.metadata,
      };

      graphEngine.addNode(jobId, node);

      // Add to stream processor for real-time matching
      const event: {
        id: string;
        jobId: string;
        type: "source" | "target";
        sourceId?: string;
        targetId?: string;
        data: Record<string, unknown>;
        amount?: number;
        currency?: string;
        timestamp: Date;
      } = {
        id: node.id,
        jobId: jobId,
        type: node.sourceId ? "source" : "target",
        data: node.data,
        timestamp: node.timestamp,
      };
      if (node.sourceId) {
        event.sourceId = node.sourceId;
      }
      if (node.targetId) {
        event.targetId = node.targetId;
      }
      if (node.amount !== undefined) {
        event.amount = node.amount;
      }
      if (node.currency) {
        event.currency = node.currency;
      }
      await streamProcessor.addEvent(event);

      res.status(201).json({
        data: node,
        capability,
        metadata: buildStrategicSurfaceMetadata(req, capability),
        message: "Node added successfully",
      });
      return;
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to add node", 400);
      return;
    }
  }
);

/**
 * POST /api/v2/reconciliation-graph/:jobId/edges
 * Add an edge to the graph
 */
router.post(
  "/:jobId/edges",
  requirePermission(Permission.TENANT_WRITE),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantContext(req, res);
      if (!tenantId) return;
      if (!(await authorizeTenantActionOr403(req, res, tenantId, "tenant.knowledge.manage")))
        return;
      const capability = requireStrategicSurfaceAvailability(
        req,
        res,
        "/api/v2/reconciliation-graph/:jobId/edges",
        RECONCILIATION_GRAPH_SURFACE
      );
      if (!capability) return;
      const jobId = req.params.jobId as string;
      if (!jobId) {
        return res.status(400).json({ error: "Job ID is required" });
      }
      const edge: ReconciliationEdge = {
        id: req.body.id || `edge_${Date.now()}_${crypto.randomUUID()}`,
        source: req.body.source || "",
        target: req.body.target || "",
        type: req.body.type || "matches",
        confidence: req.body.confidence || 1.0,
        metadata: req.body.metadata,
        createdAt: req.body.createdAt ? new Date(req.body.createdAt) : new Date(),
      };

      graphEngine.addEdge(jobId, edge);

      res.status(201).json({
        data: edge,
        capability,
        metadata: buildStrategicSurfaceMetadata(req, capability),
        message: "Edge added successfully",
      });
      return;
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to add edge", 400);
      return;
    }
  }
);

/**
 * GET /api/v2/reconciliation-graph/:jobId/query
 * Query the graph
 */
router.get(
  "/:jobId/query",
  requirePermission(Permission.TENANT_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantContext(req, res);
      if (!tenantId) return;
      if (!(await authorizeTenantActionOr403(req, res, tenantId, "tenant.memory.graph.read")))
        return;
      const capability = requireStrategicSurfaceAvailability(
        req,
        res,
        "/api/v2/reconciliation-graph/:jobId/query",
        RECONCILIATION_GRAPH_SURFACE
      );
      if (!capability) return;
      const jobId = req.params.jobId as string;
      if (!jobId) {
        return res.status(400).json({ error: "Job ID is required" });
      }
      const queryOptions: {
        jobId: string;
        nodeType?: ReconciliationNode["type"];
        sourceId?: string;
        targetId?: string;
        dateRange?: { start: Date; end: Date };
        limit?: number;
        offset?: number;
      } = {
        jobId,
      };
      if (req.query.nodeType) {
        queryOptions.nodeType = req.query.nodeType as ReconciliationNode["type"];
      }
      if (req.query.sourceId) {
        queryOptions.sourceId = req.query.sourceId as string;
      }
      if (req.query.targetId) {
        queryOptions.targetId = req.query.targetId as string;
      }
      if (req.query.startDate && req.query.endDate) {
        queryOptions.dateRange = {
          start: new Date(req.query.startDate as string),
          end: new Date(req.query.endDate as string),
        };
      }
      if (req.query.limit) {
        queryOptions.limit = parseInt(req.query.limit as string);
      }
      if (req.query.offset) {
        queryOptions.offset = parseInt(req.query.offset as string);
      }
      const query = queryOptions as GraphQuery;

      const result = graphEngine.query(query);

      res.json({
        data: {
          nodes: result.nodes,
          edges: result.edges,
          count: result.nodes.length,
        },
        capability,
        metadata: buildStrategicSurfaceMetadata(req, capability),
      });
      return;
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to query graph", 400);
      return;
    }
  }
);

/**
 * GET /api/v2/reconciliation-graph/:jobId/state
 * Get current graph state
 */
router.get(
  "/:jobId/state",
  requirePermission(Permission.TENANT_READ),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = requireTenantContext(req, res);
      if (!tenantId) return;
      if (!(await authorizeTenantActionOr403(req, res, tenantId, "tenant.memory.graph.read")))
        return;
      const capability = requireStrategicSurfaceAvailability(
        req,
        res,
        "/api/v2/reconciliation-graph/:jobId/state",
        RECONCILIATION_GRAPH_SURFACE
      );
      if (!capability) return;
      const jobId = req.params.jobId as string;
      if (!jobId) {
        return res.status(400).json({ error: "Job ID is required" });
      }
      const graph = graphEngine.getGraphState(jobId);

      if (!graph) {
        return res.status(404).json({
          error: "Graph not found",
          message: `No graph found for job ${jobId}`,
        });
      }

      res.json({
        data: {
          jobId: graph.jobId,
          nodeCount: graph.nodes.size,
          edgeCount: graph.edges.size,
          updatedAt: graph.updatedAt,
        },
        capability,
        metadata: buildStrategicSurfaceMetadata(req, capability),
      });
      return;
    } catch (error: unknown) {
      handleRouteError(res, error, "Failed to get graph state", 400);
      return;
    }
  }
);

/**
 * GET /api/v2/reconciliation-graph/:jobId/stream
 * Server-Sent Events stream for real-time updates
 */
router.get(
  "/:jobId/stream",
  requirePermission(Permission.TENANT_READ),
  async (req: AuthRequest, res: Response) => {
    const tenantId = requireTenantContext(req, res);
    if (!tenantId) return;
    if (!(await authorizeTenantActionOr403(req, res, tenantId, "tenant.memory.graph.read"))) return;
    const capability = requireStrategicSurfaceAvailability(
      req,
      res,
      "/api/v2/reconciliation-graph/:jobId/stream",
      RECONCILIATION_GRAPH_SURFACE
    );
    if (!capability) return;
    const jobIdParam = req.params["jobId"];
    const jobId = Array.isArray(jobIdParam) ? (jobIdParam[0] ?? "") : (jobIdParam ?? "");
    if (!jobId) {
      res.status(400).json({ error: "Job ID is required" });
      return;
    }

    // Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Subscribe to graph updates
    const unsubscribe = graphEngine.subscribe(jobId, (update) => {
      res.write(`data: ${JSON.stringify(update)}\n\n`);
    });

    // Clean up on client disconnect
    req.on("close", () => {
      unsubscribe();
      res.end();
    });

    // Send initial connection message
    res.write(
      `data: ${JSON.stringify({
        type: "connected",
        jobId,
        capability,
        metadata: buildStrategicSurfaceMetadata(req, capability),
      })}\n\n`
    );
  }
);

export default router;
