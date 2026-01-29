"use strict";
/**
 * API v2 Routes
 * Version 2 of the Settler API - Strategic Initiatives
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.v2Router = void 0;
const express_1 = require("express");
const reconciliation_graph_1 = __importDefault(require("./reconciliation-graph"));
const ai_agents_1 = __importDefault(require("./ai-agents"));
const network_effects_1 = __importDefault(require("./network-effects"));
const knowledge_1 = __importDefault(require("./knowledge"));
const compliance_1 = __importDefault(require("./compliance"));
exports.v2Router = (0, express_1.Router)();
// Continuous Reconciliation Graph
exports.v2Router.use("/reconciliation-graph", reconciliation_graph_1.default);
// AI Agents
exports.v2Router.use("/ai-agents", ai_agents_1.default);
// Network Effects
exports.v2Router.use("/network-effects", network_effects_1.default);
// Knowledge Management
exports.v2Router.use("/knowledge", knowledge_1.default);
// Compliance
exports.v2Router.use("/compliance", compliance_1.default);
// Health check for v2
exports.v2Router.get("/health", (_req, res) => {
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
//# sourceMappingURL=index.js.map