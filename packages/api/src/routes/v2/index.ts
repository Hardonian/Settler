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
import { daemonRouter } from "./daemon";
import { dossierRouter } from "./dossier";
import { parityRouter } from "./parity";
import { erpRouter } from "./erp";
import { interchangeRouter } from "./interchange";
import { timeTravelRouter } from "./time-travel";

export const v2Router: Router = Router();

// Time-Travel Forensic Financial Debugger
v2Router.use("/ledger/time-travel", timeTravelRouter);
v2Router.use("/time-travel", timeTravelRouter);

// Interchange++ Forensic Margin Recovery
v2Router.use("/recovery/interchange", interchangeRouter);
v2Router.use("/interchange", interchangeRouter);

// Autonomous ERP Journal Entry & NetSuite/SAP Sync
v2Router.use("/erp", erpRouter);

// TigerBeetle Dual-Ledger Invariant Parity Monitor
v2Router.use("/ledger/parity", parityRouter);

// Autonomous Continuous Settlement Daemon
v2Router.use("/daemon", daemonRouter);

// Cryptographic Audit Dossiers
v2Router.use("/audit/dossier", dossierRouter);

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
