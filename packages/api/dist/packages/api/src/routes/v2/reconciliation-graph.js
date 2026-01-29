"use strict";
/**
 * Continuous Reconciliation Graph API Routes
 *
 * REST API for graph-based reconciliation
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const graph_engine_1 = require("../../services/reconciliation-graph/graph-engine");
const stream_processor_1 = require("../../services/reconciliation-graph/stream-processor");
const error_handler_1 = require("../../utils/error-handler");
const router = (0, express_1.Router)();
/**
 * POST /api/v2/reconciliation-graph/:jobId/nodes
 * Add a node to the graph
 */
router.post("/:jobId/nodes", async (req, res) => {
    try {
        const { jobId } = req.params;
        if (!jobId) {
            return res.status(400).json({ error: "Job ID is required" });
        }
        const node = {
            id: req.body.id || `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
        graph_engine_1.graphEngine.addNode(jobId, node);
        // Add to stream processor for real-time matching
        const event = {
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
        await stream_processor_1.streamProcessor.addEvent(event);
        res.status(201).json({
            data: node,
            message: "Node added successfully",
        });
        return;
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to add node", 400);
        return;
    }
});
/**
 * POST /api/v2/reconciliation-graph/:jobId/edges
 * Add an edge to the graph
 */
router.post("/:jobId/edges", async (req, res) => {
    try {
        const { jobId } = req.params;
        if (!jobId) {
            return res.status(400).json({ error: "Job ID is required" });
        }
        const edge = {
            id: req.body.id || `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            source: req.body.source || "",
            target: req.body.target || "",
            type: req.body.type || "matches",
            confidence: req.body.confidence || 1.0,
            metadata: req.body.metadata,
            createdAt: req.body.createdAt ? new Date(req.body.createdAt) : new Date(),
        };
        graph_engine_1.graphEngine.addEdge(jobId, edge);
        res.status(201).json({
            data: edge,
            message: "Edge added successfully",
        });
        return;
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to add edge", 400);
        return;
    }
});
/**
 * GET /api/v2/reconciliation-graph/:jobId/query
 * Query the graph
 */
router.get("/:jobId/query", async (req, res) => {
    try {
        const { jobId } = req.params;
        if (!jobId) {
            return res.status(400).json({ error: "Job ID is required" });
        }
        const queryOptions = {
            jobId,
        };
        if (req.query.nodeType) {
            queryOptions.nodeType = req.query.nodeType;
        }
        if (req.query.sourceId) {
            queryOptions.sourceId = req.query.sourceId;
        }
        if (req.query.targetId) {
            queryOptions.targetId = req.query.targetId;
        }
        if (req.query.startDate && req.query.endDate) {
            queryOptions.dateRange = {
                start: new Date(req.query.startDate),
                end: new Date(req.query.endDate),
            };
        }
        if (req.query.limit) {
            queryOptions.limit = parseInt(req.query.limit);
        }
        if (req.query.offset) {
            queryOptions.offset = parseInt(req.query.offset);
        }
        const query = queryOptions;
        const result = graph_engine_1.graphEngine.query(query);
        res.json({
            data: {
                nodes: result.nodes,
                edges: result.edges,
                count: result.nodes.length,
            },
        });
        return;
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to query graph", 400);
        return;
    }
});
/**
 * GET /api/v2/reconciliation-graph/:jobId/state
 * Get current graph state
 */
router.get("/:jobId/state", async (req, res) => {
    try {
        const { jobId } = req.params;
        if (!jobId) {
            return res.status(400).json({ error: "Job ID is required" });
        }
        const graph = graph_engine_1.graphEngine.getGraphState(jobId);
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
        });
        return;
    }
    catch (error) {
        (0, error_handler_1.handleRouteError)(res, error, "Failed to get graph state", 400);
        return;
    }
});
/**
 * GET /api/v2/reconciliation-graph/:jobId/stream
 * Server-Sent Events stream for real-time updates
 */
router.get("/:jobId/stream", (req, res) => {
    const { jobId } = req.params;
    if (!jobId) {
        res.status(400).json({ error: "Job ID is required" });
        return;
    }
    // Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    // Subscribe to graph updates
    const unsubscribe = graph_engine_1.graphEngine.subscribe(jobId, (update) => {
        res.write(`data: ${JSON.stringify(update)}\n\n`);
    });
    // Clean up on client disconnect
    req.on("close", () => {
        unsubscribe();
        res.end();
    });
    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: "connected", jobId })}\n\n`);
});
exports.default = router;
//# sourceMappingURL=reconciliation-graph.js.map