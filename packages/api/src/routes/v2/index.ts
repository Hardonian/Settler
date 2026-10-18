/**
 * API v2 Routes
 * Version 2 of the Settler API - Strategic Initiatives
 */

import { Router } from "express";
import reconciliationGraphRouter from "./reconciliation-graph";
import aiAgentsRouter from "./ai-agents";
import ledgerRouter from "./ledger";
import networkEffectsRouter from "./network-effects";
import knowledgeRouter from "./knowledge";
import complianceRouter from "./compliance";
import { triangularRouter } from "./triangular";
import { ruleSynthesisRouter } from "./rule-synthesis";
import { streamRouter } from "./stream";
import { recoveryRouter } from "./recovery";

export const v2Router: Router = Router();

// Autonomous Revenue OS Recovery Pipeline
v2Router.use("/recovery", recoveryRouter);

// Backpressure-Aware SSE Streaming
v2Router.use("/stream", streamRouter);

// Triangular (3-Way) Reconciliation
v2Router.use("/reconciliation/triangular", triangularRouter);

// Adjudication Memory -> Rule Synthesis
v2Router.use("/rules/synthesize", ruleSynthesisRouter);

// Continuous Reconciliation Graph
v2Router.use("/reconciliation-graph", reconciliationGraphRouter);

// AI Agents Control & Governance
v2Router.use("/ai-agents", aiAgentsRouter);

// Dual-Ledger & TigerBeetle CDC Sync
v2Router.use("/ledger", ledgerRouter);

// Network Effects
v2Router.use("/network-effects", networkEffectsRouter);

// Knowledge Management
v2Router.use("/knowledge", knowledgeRouter);

// Compliance
v2Router.use("/compliance", complianceRouter);

// Health check for v2
v2Router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    version: "2.0.0",
    features: [
      "continuous-reconciliation-graph",
      "ai-agents",
      "network-effects",
      "knowledge-management",
      "compliance-exports",
      "privacy-preserving-reconciliation",
    ],
  });
});
